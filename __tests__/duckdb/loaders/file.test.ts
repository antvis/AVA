/**
 * Unit tests for src/duckdb/loaders/file.ts
 */

import * as path from 'path';

import { describe, it, expect, afterEach, vi } from 'vitest';

import { loadCSVFile } from '../../../src/duckdb/loaders/file';

import type { LoadedSource } from '../../../src/types';

describe('loaders/file', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
    vi.unstubAllGlobals();
  });

  it('uses a local file path directly without creating a temp file', async () => {
    const localPath = path.join(__dirname, '../../../data/companies.csv');
    source = await loadCSVFile({ path: localPath });

    expect(source.format).toBe('csv');
    expect(source.path).toBe(localPath);
  });

  it('downloads a remote file to a temp file', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new TextEncoder().encode('a,b\n1,2').buffer,
    })));

    source = await loadCSVFile({ path: 'https://example.com/data.csv' });

    expect(source.format).toBe('csv');
    expect(source.path).not.toBe('https://example.com/data.csv');
    expect(source.path.endsWith('.csv')).toBe(true);
  });
});
