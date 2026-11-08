/**
 * Unit tests for src/duckdb/util/file.ts
 */

import * as fs from 'fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

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

  it.skipIf(process.platform === 'win32')('keeps the directory and file private under a permissive Unix umask', async () => {
    const original = process.umask(0o022);
    let tmpFile: string | undefined;
    try {
      tmpFile = await writeTempFile('synthetic private cells', 'json');
      expect((await fs.stat(dirname(tmpFile))).mode & 0o777).toBe(0o700);
      expect((await fs.stat(tmpFile)).mode & 0o777).toBe(0o600);
    } finally {
      process.umask(original);
      if (tmpFile) await removeTempFile(tmpFile);
    }
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
