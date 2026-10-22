/**
 * Unit tests for src/duckdb/util/file.ts
 */

import * as fs from 'fs/promises';

import { describe, it, expect, vi } from 'vitest';

import { createFileLoader, fileSource, writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';
import { sourceConfig } from '../../../src/cli/session/protocol';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('duckdb/util/file', () => {
  it.each(['csv', 'json', 'parquet'] as const)(
    'registers an HTTP %s source without fetching or allowing its parent URL',
    async (format) => {
      const fetch = vi.spyOn(global, 'fetch');
      try {
        const options = { path: `https://example.com/data.${format}`, headers: { Authorization: "Bearer O'Brien" } };
        sourceConfig.parse({ type: format === 'parquet' ? 'parquet' : `${format}-file`, options });
        const source = await createFileLoader(format)(options);
        const conn = { run: vi.fn().mockResolvedValue(undefined), runAndReadAll: vi.fn() };
        await source.register(conn as unknown as DuckDBConnection);
        expect(source.allowedDirectories).toEqual([]);
        expect(source.allowedPaths).toEqual([options.path]);
        expect(conn.run.mock.calls.map(([sql]) => sql).join('\n')).toContain("'Authorization': 'Bearer O''Brien'");
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        fetch.mockRestore();
      }
    }
  );

  it.each(['csv', 'json', 'parquet'] as const)('rejects credentials embedded in an HTTP %s URL', async (format) => {
    await expect(
      createFileLoader(format)({ path: `https://user:password@example.com/data.${format}` })
    ).rejects.toThrow('Use headers');
  });

  it('prepares extended encodings before reading CSV', async () => {
    const conn = { run: vi.fn().mockResolvedValue(undefined), runAndReadAll: vi.fn() };
    const source = fileSource('/tmp/data.csv', 'csv', async () => {}, { encoding: 'gb18030' });
    await source.register(conn as unknown as DuckDBConnection);
    expect(conn.run.mock.calls.map(([sql]) => sql)).toEqual([
      'INSTALL encodings',
      'LOAD encodings',
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv('/tmp/data.csv', \"encoding\"='gb18030')",
    ]);
  });

  it.each([undefined, 'utf-8', 'utf-16', 'latin-1'])('does not load an extension for %s', async (encoding) => {
    const conn = { run: vi.fn().mockResolvedValue(undefined), runAndReadAll: vi.fn() };
    await fileSource('/tmp/data.csv', 'csv', async () => {}, { encoding }).register(
      conn as unknown as DuckDBConnection
    );
    expect(conn.run).toHaveBeenCalledTimes(1);
    expect(conn.run.mock.calls[0][0]).toMatch(/^CREATE OR REPLACE VIEW/);
  });

  it('writeTempFile writes content readable from the returned path', async () => {
    const tmpFile = await writeTempFile('hello ava', 'txt');
    try {
      expect(tmpFile.endsWith('.txt')).toBe(true);
      await expect(fs.readFile(tmpFile, 'utf-8')).resolves.toBe('hello ava');
    } finally {
      await removeTempFile(tmpFile);
    }
  });

  it('removeTempFile deletes the file', async () => {
    const tmpFile = await writeTempFile('bye', 'txt');
    await removeTempFile(tmpFile);
    await expect(fs.access(tmpFile)).rejects.toThrow();
  });
});
