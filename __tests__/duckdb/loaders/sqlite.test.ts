/** Real SQLite fixture: sales.csv plus customers, products, indexes and foreign keys. */
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { DuckDBEngine } from '../../../src/duckdb';
import { getLLMConfig } from '../../test-utils';

describe('loaders/sqlite', () => {
  let ava: AVA;

  afterEach(async () => {
    await ava?.dispose();
    vi.restoreAllMocks();
  });

  it('loads a SQLite file with a complete schema and queryable data', async () => {
    ava = new AVA({ llm: getLLMConfig() });
    const discover = vi.spyOn(DuckDBEngine.prototype, 'schema');
    await ava.source({
      type: 'sqlite',
      options: { path: join(__dirname, '../../datasets/sales.sqlite') },
    });

    const schema = await ava.schema();
    discover.mockRestore();

    expect(schema).toEqual({
      tables: [
        {
          name: 'customers',
          columnCount: 4,
          fields: [
            { name: 'id', type: 'INTEGER', nullable: false },
            { name: 'name', type: 'TEXT', nullable: false },
            { name: 'email', type: 'TEXT', nullable: true },
            { name: 'referrer_id', type: 'INTEGER', nullable: true },
          ],
          indexes: [
            { name: 'PRIMARY', columns: ['name'], unique: false, primary: false },
            { name: 'sqlite_autoindex_customers_1', columns: ['email'], unique: true, primary: false },
            { name: 'sqlite_primary_key_customers', columns: ['id'], unique: true, primary: true },
          ],
        },
        {
          name: 'order notes',
          columnCount: 3,
          fields: [
            { name: 'id', type: 'INTEGER', nullable: true },
            { name: 'order_id', type: 'TEXT', nullable: true },
            { name: 'note"text', type: 'TEXT', nullable: true },
          ],
          indexes: [
            { name: "idx_notes'order", columns: ['order_id'], unique: false, primary: false },
            { name: 'sqlite_autoindex_order notes_1', columns: ['id'], unique: true, primary: true },
          ],
        },
        {
          name: 'products',
          columnCount: 4,
          fields: [
            { name: 'category', type: 'TEXT', nullable: false },
            { name: 'product', type: 'TEXT', nullable: false },
            { name: 'label', type: 'TEXT', nullable: true },
            { name: 'image', type: 'BLOB', nullable: true },
          ],
          indexes: [
            { name: 'sqlite_autoindex_products_1', columns: ['product', 'category'], unique: true, primary: true },
          ],
        },
        {
          name: 'sales',
          columnCount: 14,
          fields: [
            { name: 'order_id', type: 'TEXT', nullable: false },
            { name: 'order_date', type: 'TEXT', nullable: false },
            { name: 'region', type: 'TEXT', nullable: true },
            { name: 'category', type: 'TEXT', nullable: false },
            { name: 'product', type: 'TEXT', nullable: false },
            { name: 'channel', type: 'TEXT', nullable: true },
            { name: 'quantity', type: 'INTEGER', nullable: true },
            { name: 'unit_price', type: 'REAL', nullable: true },
            { name: 'discount', type: 'REAL', nullable: true },
            { name: 'sales', type: 'REAL', nullable: true },
            { name: 'cost', type: 'REAL', nullable: true },
            { name: 'profit', type: 'REAL', nullable: true },
            { name: 'customer_id', type: 'INTEGER', nullable: true },
            { name: 'calculated_profit', type: 'REAL', nullable: true },
          ],
          indexes: [
            { name: 'idx_sales_region_date', columns: ['region', 'order_date'], unique: false, primary: false },
            { name: 'sqlite_autoindex_sales_1', columns: ['order_id'], unique: true, primary: true },
          ],
        },
      ],
      relations: [
        {
          name: 'fk_0',
          kind: 'foreign-key',
          from: { table: 'customers', columns: ['referrer_id'] },
          to: { table: 'customers', columns: ['id'] },
        },
        {
          name: 'fk_0',
          kind: 'foreign-key',
          from: { table: 'order notes', columns: ['order_id'] },
          to: { table: 'sales', columns: ['order_id'] },
        },
        {
          name: 'fk_0',
          kind: 'foreign-key',
          from: { table: 'sales', columns: ['product', 'category'] },
          to: { table: 'products', columns: ['product', 'category'] },
        },
        {
          name: 'fk_1',
          kind: 'foreign-key',
          from: { table: 'sales', columns: ['customer_id'] },
          to: { table: 'customers', columns: ['id'] },
        },
      ],
    });

    const result = await ava.engine!.execute('SELECT * FROM sales ORDER BY order_id', { maxRows: 240 });
    expect(result.data).toHaveLength(240);
    expect(result.data[0]).toEqual({
      order_id: 'ORD-0001',
      order_date: '2025-01-01',
      region: null,
      category: 'Electronics',
      product: 'Monitor',
      channel: 'Retail',
      quantity: null,
      unit_price: 249,
      discount: 0.1,
      sales: 224.1,
      cost: 165,
      profit: 59.1,
      customer_id: 1,
      calculated_profit: expect.closeTo(59.1),
    });
    expect(result.data[239]).toMatchObject({ order_id: 'ORD-0240', order_date: '2025-12-31' });
    const joined = await ava.engine!.execute(`
      SELECT s.order_id, c.name, p.label
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      JOIN products p ON p.product = s.product AND p.category = s.category
      ORDER BY s.order_id LIMIT 2
    `);
    expect(joined.data).toEqual([
      { order_id: 'ORD-0001', name: 'Alice', label: 'Electronics: Monitor' },
      { order_id: 'ORD-0002', name: 'Bob', label: 'Furniture: Office Chair' },
    ]);
    expect((await ava.engine!.execute('SELECT * FROM "order notes"')).data).toEqual([]);
    const totals = await ava.engine!.execute(`
      SELECT SUM(sales) AS revenue, SUM(calculated_profit) AS profit, SUM(customer_id) AS customers
      FROM sales WHERE order_id IN ('ORD-0001', 'ORD-0002')
    `);
    expect(totals.data).toEqual([{ revenue: expect.closeTo(904.3), profit: expect.closeTo(319.3), customers: 3 }]);
    expect(totals.schema).toEqual([
      { name: 'revenue', type: 'DOUBLE' },
      { name: 'profit', type: 'DOUBLE' },
      { name: 'customers', type: 'HUGEINT' },
    ]);
    const images = await ava.engine!.execute(`
      SELECT product, CASE WHEN image IS NULL THEN NULL ELSE hex(image) END AS image
      FROM products WHERE product IN ('Monitor', 'Office Chair', 'Laptop') ORDER BY product
    `);
    expect(images.data).toEqual([
      { product: 'Laptop', image: null },
      { product: 'Monitor', image: '00FF80' },
      { product: 'Office Chair', image: '' },
    ]);
  });
});

// These values are legal SQLite data regardless of the column's declared affinity.
it('profiles and queries actual storage types without dropping mixed values', async () => {
  const path = join(__dirname, '../../datasets/mixed.sqlite');
  const ava = new AVA({ llm: { model: 'no-model-call' } });
  try {
    await ava.source({ type: 'sqlite', options: { path } });
    const profile = await ava.profile();
    const table = profile.tables.find((table) => table.name === 'measurements')!;
    expect(table.fields.find((field) => field.name === 'amount')).toMatchObject({
      type: 'VARCHAR',
      logicalType: 'string',
    });
    expect(table.fields.find((field) => field.name === 'location')).toMatchObject({
      type: 'VARCHAR',
      logicalType: 'string',
    });
    expect(table.fields.find((field) => field.name === 'flexible')).toMatchObject({
      type: 'BIGINT',
      logicalType: 'numeric',
    });
    expect(
      (
        await ava.engine!.execute(`
      SELECT amount, location, CAST(flexible AS VARCHAR) AS flexible,
             hex(payload) AS payload, calculated,
             union_tag(mixed_blob) AS tag,
             hex(union_extract(mixed_blob, 'blob_value')) AS blob_value,
             union_extract(mixed_blob, 'text_value') AS text_value,
             union_extract(mixed_blob, 'integer_value') AS integer_value,
             union_extract(mixed_blob, 'real_value') AS real_value
      FROM measurements ORDER BY id
    `)
      ).data
    ).toEqual([
      {
        amount: '42',
        location: '(1,2)',
        flexible: '9007199254740993',
        payload: '00FF80',
        calculated: '42',
        tag: 'blob_value',
        blob_value: '00FF80',
        text_value: null,
        integer_value: null,
        real_value: null,
      },
      {
        amount: '',
        location: '(3,4)',
        flexible: '7',
        payload: '',
        calculated: '',
        tag: 'text_value',
        blob_value: null,
        text_value: 'hello',
        integer_value: null,
        real_value: null,
      },
      {
        amount: null,
        location: null,
        flexible: null,
        payload: null,
        calculated: null,
        tag: 'integer_value',
        blob_value: null,
        text_value: null,
        integer_value: 42,
        real_value: null,
      },
      {
        amount: '2.5',
        location: '(5,6)',
        flexible: '-3',
        payload: 'AB',
        calculated: '2.5',
        tag: 'real_value',
        blob_value: null,
        text_value: null,
        integer_value: null,
        real_value: 2.5,
      },
    ]);
    expect((await ava.engine!.execute('SELECT * FROM empty_table')).data).toEqual([]);
    expect((await ava.engine!.execute('SELECT * FROM measurement_view')).data).toHaveLength(4);
  } finally {
    await ava.dispose();
  }
});
