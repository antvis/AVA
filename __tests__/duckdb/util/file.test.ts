/**
 * Unit tests for src/duckdb/util/file.ts
 */

import * as fs from 'fs/promises';

import { describe, it, expect, vi } from 'vitest';

import { fileSource, writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';

describe('duckdb/util/file', () => {
  it('prepares extended encodings before reading CSV', async () => {
    const conn = { run: vi.fn().mockResolvedValue(undefined), runAndReadAll: vi.fn() };
    const source = fileSource('/tmp/data.csv', 'csv', async () => {}, { encoding: 'gb18030' });
    await source.register(conn);
    expect(conn.run.mock.calls.map(([sql]) => sql)).toEqual([
      'INSTALL encodings',
      'LOAD encodings',
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv('/tmp/data.csv', auto_detect=true, encoding='gb18030')",
    ]);
  });

  it.each([undefined, 'utf-8', 'utf-16', 'latin-1'])('does not load an extension for %s', async (encoding) => {
    const conn = { run: vi.fn().mockResolvedValue(undefined), runAndReadAll: vi.fn() };
    await fileSource('/tmp/data.csv', 'csv', async () => {}, { encoding }).register(conn);
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
