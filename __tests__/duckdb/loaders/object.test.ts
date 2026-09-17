/**
 * Unit tests for src/duckdb/loaders/object.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { loadObject } from '../../../src/duckdb/loaders/object';

import { registerAndQuery } from './helper';

import type { LoadedSource } from '../../../src/types';

describe('loaders/object', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('registers an object array as a queryable view', async () => {
    source = await loadObject({ data: [{ name: 'Alice', age: 30 }] });

    const rows = await registerAndQuery(source);
    expect(rows).toEqual([{ name: 'Alice', age: 30 }]);
  });

  it('rejects non-array input', async () => {
    await expect(loadObject({ data: {} as any })).rejects.toThrow('Data must be an array');
  });
});
