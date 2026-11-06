/**
 * Unit tests for src/duckdb/util/file.ts
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, it, expect, vi } from 'vitest';

import { fileSource, writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return { ...actual, randomUUID: vi.fn(actual.randomUUID) };
});
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, open: vi.fn(actual.open), unlink: vi.fn(actual.unlink) };
});

beforeEach(() => {
  vi.mocked(randomUUID).mockReset();
  vi.mocked(fs.open).mockReset();
  vi.mocked(fs.unlink).mockReset();
});

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

  it('removeTempFile deletes the file', async () => {
    const tmpFile = await writeTempFile('bye', 'txt');
    await removeTempFile(tmpFile);
    await expect(fs.access(tmpFile)).rejects.toThrow();
  });

  it('opens source files exclusively with owner-only permissions before writing', async () => {
    const tmpFile = await writeTempFile('synthetic private cells', 'json');
    try {
      expect(fs.open).toHaveBeenCalledWith(tmpFile, 'wx', 0o600);
      await expect(fs.readFile(tmpFile, 'utf8')).resolves.toBe('synthetic private cells');
    } finally {
      await removeTempFile(tmpFile);
    }
  });

  it.skipIf(process.platform === 'win32')('creates mode 0600 under a permissive Unix umask', async () => {
    const original = process.umask(0o022);
    let tmpFile: string | undefined;
    try {
      tmpFile = await writeTempFile('synthetic private cells', 'json');
      expect((await fs.stat(tmpFile)).mode & 0o777).toBe(0o600);
    } finally {
      process.umask(original);
      if (tmpFile) await removeTempFile(tmpFile);
    }
  });

  it('does not overwrite or remove an existing candidate file', async () => {
    const uuid = '00000000-0000-4000-8000-000000000001';
    const path = join(tmpdir(), `ava-source-${uuid}.json`);
    // Create a file owned by this test, not an unrelated file in the shared temp directory.
    await fs.writeFile(path, 'existing content', { flag: 'wx', mode: 0o600 });
    try {
      vi.mocked(randomUUID).mockReturnValueOnce(uuid);
      await expect(writeTempFile('replacement', 'json')).rejects.toMatchObject({ code: 'EEXIST' });
      await expect(fs.readFile(path, 'utf8')).resolves.toBe('existing content');
      expect(fs.unlink).not.toHaveBeenCalled();
    } finally {
      await removeTempFile(path);
    }
  });

  it('closes and removes its own partial file when writing fails', async () => {
    const error = new Error('simulated write failure');
    const close = vi.fn().mockResolvedValue(undefined);
    vi.mocked(fs.open).mockResolvedValueOnce({ writeFile: vi.fn().mockRejectedValue(error), close } as never);
    vi.mocked(fs.unlink).mockResolvedValueOnce(undefined);
    await expect(writeTempFile('synthetic private cells', 'json')).rejects.toBe(error);
    expect(close).toHaveBeenCalledOnce();
    expect(fs.unlink).toHaveBeenCalledWith(vi.mocked(fs.open).mock.calls[0][0]);
  });

  it.skipIf(process.platform === 'win32')('does not follow or unlink a pre-existing symlink', async () => {
    const target = await writeTempFile('existing target content', 'json');
    const uuid = '00000000-0000-4000-8000-000000000002';
    const candidate = join(tmpdir(), `ava-source-${uuid}.json`);
    await fs.symlink(target, candidate);
    try {
      vi.mocked(randomUUID).mockReturnValueOnce(uuid);
      await expect(writeTempFile('replacement', 'json')).rejects.toMatchObject({ code: 'EEXIST' });
      expect((await fs.lstat(candidate)).isSymbolicLink()).toBe(true);
      await expect(fs.readFile(target, 'utf8')).resolves.toBe('existing target content');
    } finally {
      await removeTempFile(candidate);
      await removeTempFile(target);
    }
  });
});
