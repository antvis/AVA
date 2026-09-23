/** Real SQLite fixture: sales.csv plus customers, products, indexes and foreign keys. */
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { getLLMConfig } from '../../test-utils';

describe('loaders/sqlite', () => {
  let ava: AVA;

  afterEach(async () => {
    await ava?.dispose();
  });

  it('loads a SQLite file with a complete schema and queryable data', async () => {
    ava = new AVA({ llm: getLLMConfig() });
    const schema = await ava.load({
      type: 'sqlite',
      options: { path: join(__dirname, '../../datasets/sales.sqlite') },
    });

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
