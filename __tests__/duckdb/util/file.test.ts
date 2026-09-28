/**
 * Unit tests for src/duckdb/util/file.ts
 */

import * as fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { DuckDBInstance } from '@duckdb/node-api';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { loadCSVFile } from '../../../src/duckdb/loaders/csv-file';
import { writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';
import { OFFLINE_LLM, LENIENT_CSV_OPTIONS } from '../test-utils';

import type { LoadedSource } from '../../../src/types';

describe('duckdb/util/file', () => {
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

const sandbox = vi.hoisted(() => ({ path: '' }));
vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>();
  return { ...original, tmpdir: () => sandbox.path || original.tmpdir() };
});

// Every request is stubbed. The mocked OS temp root confines test-owned files
// to a directory we remove even when a cleanup regression fails.
describe('duckdb/util/file remote downloads', () => {
  let engine: DuckDBEngine;
  const sources: LoadedSource[] = [];
  beforeEach(async () => {
    const os = await vi.importActual<typeof import('node:os')>('node:os');
    sandbox.path = await fs.mkdtemp(join(os.tmpdir(), 'ava-csv-remote-test-'));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('name\nAlice\n'))
    );
    engine = new DuckDBEngine(OFFLINE_LLM);
  });
  afterEach(async () => {
    try {
      await engine?.dispose();
      for (const source of sources.splice(0)) await source.cleanup?.();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      await fs.rm(sandbox.path, { recursive: true, force: true });
      sandbox.path = '';
    }
  });

  it('forwards headers and removes only its downloaded file on dispose', async () => {
    const sibling = join(sandbox.path, 'owned-by-someone-else.csv');
    await fs.writeFile(sibling, 'keep');
    const url = 'https://example.invalid/data.csv?signature=test-only';
    const headers = { Authorization: 'Bearer synthetic-test-value' };
    await engine.load({ type: 'csv-file', options: { path: url, headers } });
    expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({ headers }));
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ name: 'Alice' }]);
    await engine.dispose();
    expect(await fs.readFile(sibling, 'utf8')).toBe('keep');
    expect(await fs.readdir(sandbox.path)).toEqual(['owned-by-someone-else.csv']);
  });

  it.each(['https://example.invalid/data.csv.gz', 'https://example.invalid/data.csv.gz?signature=test-only'])(
    'retains gzip information for %s (raw gzip body, no Content-Encoding)',
    async (url) => {
      const bytes = gzipSync(Buffer.from('name\nAlice\nBob\n'));
      vi.mocked(fetch).mockImplementation(async () => new Response(Uint8Array.from(bytes)));
      await engine.load({ type: 'csv-file', options: { path: url, options: LENIENT_CSV_OPTIONS } });
      expect((await engine.execute('SELECT * FROM data ORDER BY name')).data).toEqual([
        { name: 'Alice' },
        { name: 'Bob' },
      ]);
    }
  );

  it('reads an explicitly declared gzip body as a positive compression control', async () => {
    const bytes = gzipSync(Buffer.from('name\nAlice\n'));
    vi.mocked(fetch).mockImplementation(async () => new Response(Uint8Array.from(bytes)));
    await engine.load({
      type: 'csv-file',
      options: {
        path: 'https://example.invalid/download',
        options: { ...LENIENT_CSV_OPTIONS, compression: 'gzip' },
      },
    });
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ name: 'Alice' }]);
  });

  it.each([403, 404, 500])('rejects HTTP %i without staging its error body', async (status) => {
    vi.mocked(fetch).mockImplementation(async () => new Response('error body', { status }));
    await expect(
      engine.load({ type: 'csv-file', options: { path: 'https://example.invalid/data.csv' } })
    ).rejects.toThrow(String(status));
    expect(await fs.readdir(sandbox.path)).toEqual([]);
  });

  it('cleans up a downloaded file when CSV registration fails', async () => {
    vi.mocked(fetch).mockImplementation(async () => new Response('value\nnot-an-integer\n'));
    await expect(
      engine.load({
        type: 'csv-file',
        options: {
          path: 'https://example.invalid/data.csv',
          options: { header: true, columns: { value: 'NOT_A_REAL_TYPE' } },
        },
      })
    ).rejects.toThrow();
    expect(await fs.readdir(sandbox.path)).toEqual([]);
  });

  it('cleans up if connection creation fails after downloading', async () => {
    vi.spyOn(DuckDBInstance, 'create').mockRejectedValueOnce(new Error('injected connection failure'));
    await expect(
      engine.load({ type: 'csv-file', options: { path: 'https://example.invalid/data.csv' } })
    ).rejects.toThrow('injected connection failure');
    expect(await fs.readdir(sandbox.path)).toEqual([]);
  });

  it('exposes the staged file directory for lazy reads and cleans its owned source', async () => {
    const source = await loadCSVFile({ path: 'https://example.invalid/data.csv' });
    sources.push(source);
    const files = await fs.readdir(sandbox.path);
    expect(files).toHaveLength(1);
    expect(source.allowedDirectories).toEqual([dirname(join(sandbox.path, files[0]))]);
    await source.cleanup();
    expect(await fs.readdir(sandbox.path)).toEqual([]);
  });

  it('propagates a network failure without staging a file', async () => {
    const error = new TypeError('injected network failure');
    vi.mocked(fetch).mockRejectedValueOnce(error);
    await expect(engine.load({ type: 'csv-file', options: { path: 'https://example.invalid/data.csv' } })).rejects.toBe(
      error
    );
    expect(await fs.readdir(sandbox.path)).toEqual([]);
  });

  it('propagates a failed response body without leaving a partial file', async () => {
    const error = new Error('injected body failure');
    const response = new Response('unused');
    vi.spyOn(response, 'arrayBuffer').mockRejectedValueOnce(error);
    vi.mocked(fetch).mockResolvedValueOnce(response);
    await expect(engine.load({ type: 'csv-file', options: { path: 'https://example.invalid/data.csv' } })).rejects.toBe(
      error
    );
    expect(await fs.readdir(sandbox.path)).toEqual([]);
  });
});
