/**
 * Unit tests for src/duckdb/loaders/file.ts
 */

import * as path from 'path';

import { describe, it, expect, afterEach, vi } from 'vitest';

import { loadCSVFile } from '../../../src/duckdb/loaders/file';

import { registerAndQuery } from './helper';

import type { LoadedSource } from '../../../src/types';

describe('loaders/file', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
    vi.unstubAllGlobals();
  });

  it('registers a local csv file as a queryable view', async () => {
    const localPath = path.join(__dirname, '../../../data/companies.csv');
    source = await loadCSVFile({ path: localPath });

    const rows = await registerAndQuery(source);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('downloads a remote file and registers it as a queryable view', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new TextEncoder().encode('a,b\n1,2').buffer,
    })));

    source = await loadCSVFile({ path: 'https://example.com/data.csv' });

    const rows = await registerAndQuery(source);
    expect(rows).toEqual([{ a: 1, b: 2 }]);
  });
});
