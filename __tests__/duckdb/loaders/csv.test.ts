/**
 * Unit tests for src/duckdb/loaders/csv.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { loadCSV } from '../../../src/duckdb/loaders/csv';

import { registerAndQuery } from './helper';

import type { LoadedSource } from '../../../src/types';

describe('loaders/csv', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('registers CSV content as a queryable view', async () => {
    source = await loadCSV({ csv: 'name,age\nAlice,30\nBob,25' });

    const rows = await registerAndQuery(source);
    expect(rows).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });
});
