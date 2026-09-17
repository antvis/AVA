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

  it('registers a local csv file as a queryable view', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const localPath = path.join(__dirname, '../../../data/companies.csv');
    await engine.load({ type: 'csv-file', options: { path: localPath } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('downloads a remote file and registers it as a queryable view', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new TextEncoder().encode('a,b\n1,2').buffer,
    })));

    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'csv-file', options: { path: 'https://example.com/data.csv' } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows).toEqual([{ a: 1, b: 2 }]);
  });
});
