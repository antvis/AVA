/**
 * Unit tests for src/duckdb/loaders/json.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/json', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('registers an object array as a queryable view', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ name: 'Alice', age: 30 }] } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.data).toEqual([{ name: 'Alice', age: 30 }]);
  });

  it('rejects non-array input', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(engine.load({ type: 'json', options: { data: {} as any } })).rejects.toThrow('Data must be an array');
  });
});
