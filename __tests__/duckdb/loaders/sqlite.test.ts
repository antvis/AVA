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
    await ava.source({ type: 'sqlite', options: { path: join(__dirname, '../../datasets/sales.sqlite') } });

    const schema = await ava.schema();
    discover.mockRestore();

    expect(schema).toEqual({
      models: [
        {
          name: 'customers',
          columns: [
            { name: 'id', type: 'INTEGER', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'email', type: 'TEXT', notNull: false },
            { name: 'referrer_id', type: 'INTEGER', notNull: false },
          ],
          primaryKey: 'id',
          uniqueKeys: ['email'],
          tableReference: { table: 'customers' },
        },
        {
          name: 'order notes',
          columns: [
            { name: 'id', type: 'INTEGER', notNull: false },
            { name: 'order_id', type: 'TEXT', notNull: false },
            { name: 'note"text', type: 'TEXT', notNull: false },
          ],
          primaryKey: 'id',
          tableReference: { table: 'order notes' },
        },
        {
          name: 'products',
          columns: [
            { name: 'category', type: 'TEXT', notNull: true },
            { name: 'product', type: 'TEXT', notNull: true },
            { name: 'label', type: 'TEXT', notNull: false },
            { name: 'image', type: 'BLOB', notNull: false },
          ],
          primaryKey: ['product', 'category'],
          tableReference: { table: 'products' },
        },
        {
          name: 'sales',
          columns: [
            { name: 'order_id', type: 'TEXT', notNull: true },
            { name: 'order_date', type: 'TEXT', notNull: true },
            { name: 'region', type: 'TEXT', notNull: false },
            { name: 'category', type: 'TEXT', notNull: true },
            { name: 'product', type: 'TEXT', notNull: true },
            { name: 'channel', type: 'TEXT', notNull: false },
            { name: 'quantity', type: 'INTEGER', notNull: false },
            { name: 'unit_price', type: 'REAL', notNull: false },
            { name: 'discount', type: 'REAL', notNull: false },
            { name: 'sales', type: 'REAL', notNull: false },
            { name: 'cost', type: 'REAL', notNull: false },
            { name: 'profit', type: 'REAL', notNull: false },
            { name: 'customer_id', type: 'INTEGER', notNull: false },
            { name: 'calculated_profit', type: 'REAL', notNull: false },
          ],
          primaryKey: 'order_id',
          tableReference: { table: 'sales' },
        },
      ],
      relationships: [
        {
          name: 'fk_0',
          models: ['customers', 'customers'],
          joinType: 'MANY_TO_ONE',
          condition: '"customers"."referrer_id" = "customers"."id"',
        },
        {
          name: 'fk_0_2',
          models: ['order notes', 'sales'],
          joinType: 'MANY_TO_ONE',
          condition: '"order notes"."order_id" = "sales"."order_id"',
        },
        {
          name: 'fk_0_3',
          models: ['sales', 'products'],
          joinType: 'MANY_TO_ONE',
          condition: '"sales"."product" = "products"."product" AND "sales"."category" = "products"."category"',
        },
        {
          name: 'fk_1',
          models: ['sales', 'customers'],
          joinType: 'MANY_TO_ONE',
          condition: '"sales"."customer_id" = "customers"."id"',
        },
      ],
      views: [],
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
    const table = profile.models.find((table) => table.name === 'measurements')!;
    expect(table.columns.find((field) => field.name === 'amount')).toMatchObject({
      properties: { logicalType: 'string' },
    });
    expect(table.columns.find((field) => field.name === 'location')).toMatchObject({
      properties: { logicalType: 'string' },
    });
    expect(table.columns.find((field) => field.name === 'flexible')).toMatchObject({
      properties: { logicalType: 'numeric' },
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
