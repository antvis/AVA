/**
 * Unit tests for src/duckdb/loaders/url.ts
 */

import * as fs from 'fs/promises';

import { describe, it, expect, afterEach, vi } from 'vitest';

import { loadURL } from '../../../src/duckdb/loaders/url';

import type { LoadedSource } from '../../../src/types';

describe('loaders/url', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
    vi.unstubAllGlobals();
  });

  it('fetches JSON and applies transform into a temp json file', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ users: [{ name: 'Alice' }, { name: 'Bob' }] }),
    })));

    source = await loadURL({
      url: 'https://api.example.com/data',
      transform: (res) => res.users,
    });

    expect(source.format).toBe('json');
    const content = JSON.parse(await fs.readFile(source.path, 'utf-8'));
    expect(content).toEqual([{ name: 'Alice' }, { name: 'Bob' }]);
  });

  it('rejects when the result is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ notAnArray: true }),
    })));

    await expect(loadURL({ url: 'https://api.example.com/data' })).rejects.toThrow('Result must be an array');
  });
});
