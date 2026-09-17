/**
 * Unit tests for src/duckdb/loaders/excel.ts
 * Uses the two-sheet fixture data/sheets.xlsx (Sales + Costs).
 */

import * as path from 'path';

import { DuckDBInstance } from '@duckdb/node-api';
import { describe, it, expect, afterEach } from 'vitest';

import { loadExcel } from '../../../src/duckdb/loaders/excel';

import type { LoadedSource } from '../../../src/types';

describe('loaders/excel', () => {
  let source: LoadedSource | null = null;
  const xlsxPath = path.join(__dirname, '../../../data/sheets.xlsx');

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('registers one view per sheet and reads each sheet', async () => {
    source = await loadExcel({ path: xlsxPath });

    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();
    try {
      const tableNames = await source.register(conn);
      expect(tableNames).toEqual(['Sales', 'Costs']);

      const sales = await conn.runAndReadAll('SELECT * FROM "Sales" ORDER BY region');
      expect(sales.getRowObjectsJson()).toEqual([
        { region: 'East', revenue: 100 },
        { region: 'West', revenue: 200 },
      ]);

      const costs = await conn.runAndReadAll('SELECT * FROM "Costs" ORDER BY region');
      expect(costs.getRowObjectsJson()).toEqual([
        { region: 'East', cost: 30 },
        { region: 'West', cost: 50 },
      ]);
    } finally {
      conn.closeSync();
      instance.closeSync();
    }
  });

  it('supports joining across sheets', async () => {
    source = await loadExcel({ path: xlsxPath });

    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();
    try {
      await source.register(conn);
      const reader = await conn.runAndReadAll(
        'SELECT s.region, s.revenue - c.cost AS profit FROM "Sales" s JOIN "Costs" c USING (region) ORDER BY s.region'
      );
      expect(reader.getRowObjectsJson()).toEqual([
        { region: 'East', profit: 70 },
        { region: 'West', profit: 150 },
      ]);
    } finally {
      conn.closeSync();
      instance.closeSync();
    }
  });

  it('throws for a non-xlsx file', async () => {
    source = await loadExcel({ path: path.join(__dirname, '../../../data/companies.csv') });

    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();
    try {
      await expect(source.register(conn)).rejects.toThrow();
    } finally {
      conn.closeSync();
      instance.closeSync();
    }
  });
});
