/**
 * Unit tests for src/duckdb/loaders/url.ts
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { loadURL } from '../../../src/duckdb/loaders/url';

import { registerAndQuery } from './helper';

import type { LoadedSource } from '../../../src/types';

describe('loaders/url', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
    vi.unstubAllGlobals();
  });

  it('fetches JSON, applies transform, and registers a queryable view', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ users: [{ name: 'Alice' }, { name: 'Bob' }] }),
    })));

    source = await loadURL({
      url: 'https://api.example.com/data',
      transform: (res) => res.users,
    });

    const rows = await registerAndQuery(source);
    expect(rows).toEqual([{ name: 'Alice' }, { name: 'Bob' }]);
  });

  it('rejects when the result is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ notAnArray: true }),
    })));

    await expect(loadURL({ url: 'https://api.example.com/data' })).rejects.toThrow('Result must be an array');
  });
});
