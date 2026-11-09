/**
 * Unit tests for src/duckdb/util/file.ts
 */

import * as fs from 'fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, it, expect, vi } from 'vitest';

import { downloadToTempFile, fileSource, writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';

afterEach(() => vi.unstubAllGlobals());

describe('duckdb/util/file', () => {
  it('does not add a signed URL or response status text to download errors', async () => {
    const url = 'https://user:url-password@example.com/data.csv?signature=url-signature';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403, statusText: 'status-secret' })));
    await expect(downloadToTempFile(url, 'csv', { 'X-Custom-Key': 'header-secret' })).rejects.toEqual(
      new Error('Failed to fetch remote file (HTTP 403).')
    );
  });

  it('preserves the original fetch error for SDK callers', async () => {
    const failure = Object.assign(new Error('upstream error with token=original-secret'), { code: 'ECONNRESET' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
    await expect(downloadToTempFile('https://example.com/data.csv', 'csv')).rejects.toBe(failure);
  });

  it('prepares extended encodings before reading CSV', async () => {
    const conn = { run: vi.fn().mockResolvedValue(undefined), runAndReadAll: vi.fn() };
    const source = fileSource('/tmp/data.csv', 'csv', async () => {}, { encoding: 'gb18030' });
    await source.register(conn);
    expect(conn.run.mock.calls.map(([sql]) => sql)).toEqual([
      'INSTALL encodings',
      'LOAD encodings',
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv('/tmp/data.csv', auto_detect=true, \"encoding\"='gb18030')",
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

  it('removeTempFile deletes the file and its private directory', async () => {
    const tmpFile = await writeTempFile('bye', 'txt');
    await removeTempFile(tmpFile);
    await expect(fs.access(tmpFile)).rejects.toThrow();
    await expect(fs.access(dirname(tmpFile))).rejects.toThrow();
  });

  it('removes the private directory when writing fails', async () => {
    const directory = await fs.mkdtemp(join(tmpdir(), 'ava-write-failed-'));
    vi.stubEnv(process.platform === 'win32' ? 'TEMP' : 'TMPDIR', directory);
    try {
      await expect(writeTempFile('data', 'missing/file')).rejects.toThrow();
      expect(await fs.readdir(directory)).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
