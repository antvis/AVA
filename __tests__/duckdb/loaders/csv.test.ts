/**
 * Unit tests for src/duckdb/loaders/csv.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/csv', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('registers CSV content as a queryable view', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'csv', options: { csv: 'name,age\nAlice,30\nBob,25' } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });
});
