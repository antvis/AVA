/**
 * Unit tests for src/duckdb/loaders/excel.ts
 * Uses __tests__/datasets/sales.xlsx, generated from sales.csv (Sales + Costs).
 */

import * as path from 'path';

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/excel', () => {
  let engine: DuckDBEngine | null = null;
  const xlsxPath = path.join(__dirname, '../../datasets/sales.xlsx');

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads both sheets with complete schemas and queryable data', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({ type: 'excel', options: { path: xlsxPath } });

    expect(schema).toEqual({
      tables: [
        {
          name: 'Costs',
          columnCount: 2,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'cost', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
        {
          name: 'Sales',
          columnCount: 12,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'order_date', type: 'DATE', nullable: true },
            { name: 'region', type: 'VARCHAR', nullable: true },
            { name: 'category', type: 'VARCHAR', nullable: true },
            { name: 'product', type: 'VARCHAR', nullable: true },
            { name: 'channel', type: 'VARCHAR', nullable: true },
            { name: 'quantity', type: 'DOUBLE', nullable: true },
            { name: 'unit_price', type: 'DOUBLE', nullable: true },
            { name: 'discount', type: 'DOUBLE', nullable: true },
            { name: 'sales', type: 'DOUBLE', nullable: true },
            { name: 'cost', type: 'DOUBLE', nullable: true },
            { name: 'profit', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });

    const sales = await engine.execute('SELECT * FROM "Sales" ORDER BY order_id', { maxRows: 240 });
    expect(sales.data).toHaveLength(240);
    expect(sales.data[0]).toEqual({
      order_id: 'ORD-0001',
      order_date: '2025-01-01',
      region: 'East',
      category: 'Electronics',
      product: 'Monitor',
      channel: 'Retail',
      quantity: 1,
      unit_price: 249,
      discount: 0.1,
      sales: 224.1,
      cost: 165,
      profit: 59.1,
    });
    expect(sales.data[239]).toMatchObject({ order_id: 'ORD-0240', order_date: '2025-12-31' });

    const costs = await engine.execute('SELECT * FROM "Costs" ORDER BY order_id', { maxRows: 240 });
    expect(costs.data).toHaveLength(240);
    expect(costs.data[0]).toEqual({ order_id: 'ORD-0001', cost: 165 });
    expect(costs.data[239]).toEqual({ order_id: 'ORD-0240', cost: 520 });
  });

  it('supports joining across sheets', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'excel', options: { path: xlsxPath } });

    const rows = await engine.execute(
      `SELECT s.order_id, ROUND(s.sales - c.cost, 2) AS profit
       FROM "Sales" s JOIN "Costs" c USING (order_id) ORDER BY s.order_id`,
      { maxRows: 240 }
    );
    expect(rows.data).toHaveLength(240);
    expect(rows.data.slice(0, 3)).toEqual([
      { order_id: 'ORD-0001', profit: 59.1 },
      { order_id: 'ORD-0002', profit: 260.2 },
      { order_id: 'ORD-0003', profit: 376.2 },
    ]);
  });

  it('throws for a non-xlsx file', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(
      engine.load({ type: 'excel', options: { path: path.join(__dirname, '../../../data/companies.csv') } })
    ).rejects.toThrow();
  });
});
