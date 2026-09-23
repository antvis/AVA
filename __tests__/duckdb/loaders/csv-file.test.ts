/**
 * Unit tests for src/duckdb/loaders/csv-file.ts
 */

import * as path from 'path';

import { describe, it, expect, afterEach, vi } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/csv-file', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
    vi.unstubAllGlobals();
  });

  it('loads the sales CSV with a complete schema and original column order', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const csvPath = path.join(__dirname, '../../datasets/sales.csv');
    const schema = await engine.load({ type: 'csv-file', options: { path: csvPath } });

    expect(schema).toEqual({
      tables: [
        {
          name: 'data',
          columnCount: 12,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'order_date', type: 'DATE', nullable: true },
            { name: 'region', type: 'VARCHAR', nullable: true },
            { name: 'category', type: 'VARCHAR', nullable: true },
            { name: 'product', type: 'VARCHAR', nullable: true },
            { name: 'channel', type: 'VARCHAR', nullable: true },
            { name: 'quantity', type: 'BIGINT', nullable: true },
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
  });

  it('downloads a remote file and registers it as a queryable view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new TextEncoder().encode('a,b\n1,2').buffer,
      }))
    );

    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'csv-file', options: { path: 'https://example.com/data.csv' } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.data).toEqual([{ a: 1, b: 2 }]);
  });

  it('passes reader options (delim) through to read_csv', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const localPath = path.join(__dirname, '../../../data/semicolon.csv');
    await engine.load({ type: 'csv-file', options: { path: localPath, options: { delim: ';' } } });

    const rows = await engine.execute('SELECT * FROM "data" ORDER BY name');
    expect(rows.data).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });
});
