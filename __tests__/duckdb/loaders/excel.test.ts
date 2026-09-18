/**
 * Unit tests for src/duckdb/loaders/excel.ts
 * Uses the two-sheet fixture data/sheets.xlsx (Sales + Costs).
 */

import * as path from 'path';

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/excel', () => {
  let engine: DuckDBEngine | null = null;
  const xlsxPath = path.join(__dirname, '../../../data/sheets.xlsx');

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('registers one view per sheet and reads each sheet', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({ type: 'excel', options: { path: xlsxPath } });

    expect(schema.tables.map((t) => t.name)).toEqual(['Sales', 'Costs']);

    const sales = await engine.execute('SELECT * FROM "Sales" ORDER BY region');
    expect(sales).toEqual([
      { region: 'East', revenue: 100 },
      { region: 'West', revenue: 200 },
    ]);

    const costs = await engine.execute('SELECT * FROM "Costs" ORDER BY region');
    expect(costs).toEqual([
      { region: 'East', cost: 30 },
      { region: 'West', cost: 50 },
    ]);
  });

  it('supports joining across sheets', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'excel', options: { path: xlsxPath } });

    const rows = await engine.execute(
      'SELECT s.region, s.revenue - c.cost AS profit FROM "Sales" s JOIN "Costs" c USING (region) ORDER BY s.region'
    );
    expect(rows).toEqual([
      { region: 'East', profit: 70 },
      { region: 'West', profit: 150 },
    ]);
  });

  it('throws for a non-xlsx file', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(
      engine.load({ type: 'excel', options: { path: path.join(__dirname, '../../../data/companies.csv') } })
    ).rejects.toThrow();
  });
});
