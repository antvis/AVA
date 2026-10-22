/** Real SQLite fixture: sales.csv plus customers, products, indexes and foreign keys. */
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { AVA } from '../../../src';
import { DuckDBEngine } from '../../../src/duckdb';
import { loadSQLite } from '../../../src/duckdb/loaders/sqlite';
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
    });
    expect(result.data[239]).toMatchObject({ order_id: 'ORD-0240', order_date: '2025-12-31' });
    const joined = await ava.engine!.execute(`
      SELECT s.order_id, c.name, p.category
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      JOIN products p ON p.product = s.product AND p.category = s.category
      ORDER BY s.order_id LIMIT 2
    `);
    expect(joined.data).toEqual([
      { order_id: 'ORD-0001', name: 'Alice', category: 'Electronics' },
      { order_id: 'ORD-0002', name: 'Bob', category: 'Furniture' },
    ]);
    expect((await ava.engine!.execute('SELECT * FROM "order notes"')).data).toEqual([]);
    const totals = await ava.engine!.execute(`
      SELECT SUM(sales) AS revenue, SUM(profit) AS profit, SUM(customer_id) AS customers
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

it('uses native column pruning and a read-only attachment', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const conn = await db.connect();
  const source = await loadSQLite({ path: join(__dirname, '../../datasets/sales.sqlite') });
  try {
    await source.register(conn);
    const plan = (await conn.runAndReadAll('EXPLAIN SELECT name FROM customers'))
      .getRowObjectsJson()
      .map((row) => row.explain_value)
      .join('\n');
    expect(plan).toMatch(/Sqlite Scan|SQLITE_SCAN/i);
    expect(plan).toContain('Projections: name');
    expect(plan).not.toMatch(/Sqlite Query|SQLITE_QUERY/i);
    await expect(conn.run("INSERT INTO customers (id, name) VALUES (100, 'Blocked')")).rejects.toThrow(/read.only/i);
  } finally {
    conn.closeSync();
    db.closeSync();
    await source.cleanup();
  }
});

it('reports mixed-type errors instead of silently converting the source', async () => {
  const engine = new DuckDBEngine({ model: 'unused' });
  try {
    await engine.load({ type: 'sqlite', options: { path: join(__dirname, '../../datasets/mixed.sqlite') } });
    await expect(engine.execute('SELECT location FROM measurements')).rejects.toThrow(/Mismatch Type/);
    expect((await engine.execute('SELECT * FROM empty_table')).data).toEqual([]);
  } finally {
    await engine.dispose();
  }
});

it('reads mixed types as strings with the official all-varchar setting', async () => {
  const engine = new DuckDBEngine({ model: 'unused' });
  try {
    const path = join(__dirname, '../../datasets/mixed.sqlite');
    await engine.load({ type: 'sqlite', options: { path, allVarchar: true } });
    const schema = await engine.schema();
    expect(schema.models.flatMap((table) => table.columns).every((column) => column.type === 'VARCHAR')).toBe(true);
    expect(
      schema.models.find((table) => table.name === 'measurements')!.columns.map((column) => column.name)
    ).not.toContain('calculated');
    const result = await engine.execute('SELECT amount, location, flexible FROM measurements ORDER BY id');
    expect(result.schema.every((column) => column.type === 'VARCHAR')).toBe(true);
    expect(result.data).toEqual([
      { amount: '42', location: '(1,2)', flexible: '9007199254740993' },
      { amount: '', location: '(3,4)', flexible: '7' },
      { amount: null, location: null, flexible: null },
      { amount: '2.5', location: '(5,6)', flexible: '-3' },
    ]);
    expect((await engine.execute('SELECT * FROM measurement_view')).data).toHaveLength(4);
    const profile = await engine.profile(schema);
    expect(
      profile.models.find((table) => table.name === 'measurements')!.columns.find((field) => field.name === 'amount')
    ).toMatchObject({ properties: { logicalType: 'string' }, metrics: { null_count: 1 } });
    await engine.load({ type: 'sqlite', options: { path } });
    await expect(engine.execute('SELECT location FROM measurements')).rejects.toThrow(/Mismatch Type/);
  } finally {
    await engine.dispose();
  }
});

it('preserves native dates, timestamps, integer precision and blobs', async () => {
  const path = join(__dirname, '../../datasets/native-types.sqlite');
  const engine = new DuckDBEngine({ model: 'unused' });
  try {
    await engine.load({ type: 'sqlite', options: { path } });
    const result = await engine.execute(`SELECT id, d, ts, hex(payload) AS payload,
      list_transform([1, 2], lambda x: x + 1) AS values FROM events`);
    expect(result.schema.slice(0, 3)).toEqual([
      { name: 'id', type: 'BIGINT' },
      { name: 'd', type: 'DATE' },
      { name: 'ts', type: 'TIMESTAMP' },
    ]);
    expect(result.data).toEqual([
      {
        id: '9007199254740993',
        d: '2026-10-22',
        ts: '2026-10-22 01:02:03',
        payload: '00FF80',
        values: [2, 3],
      },
    ]);
    const schema = await engine.schema();
    expect(schema.models[0].columns.map((column) => column.name)).not.toContain('generated_key');
    expect(schema.models[0].uniqueKeys).toBeUndefined();
    const profile = await engine.profile(schema);
    expect(profile.models[0].columns.find((column) => column.name === 'd')).toMatchObject({
      properties: { logicalType: 'date' },
      metrics: { min: Date.UTC(2026, 9, 22), max: Date.UTC(2026, 9, 22) },
    });
    expect((await engine.execute('SELECT amount FROM events')).schema).toEqual([{ name: 'amount', type: 'DOUBLE' }]);
    await engine.load({ type: 'sqlite', options: { path, allVarchar: true } });
    expect((await engine.execute('SELECT amount FROM events')).data).toEqual([{ amount: '9007199254740993' }]);
  } finally {
    await engine.dispose();
  }
});
