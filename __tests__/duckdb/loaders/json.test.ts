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

  it('applies explicit types, projection and date parsing to inline JSON', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'json',
      options: {
        data: [{ id: 42, day: '31/12/2025', omitted: true }],
        options: { auto_detect: false, columns: { id: 'VARCHAR', day: 'DATE' }, dateformat: '%d/%m/%Y' },
      },
    });
    const rows = await engine.execute('SELECT *, typeof(day) AS day_type FROM data');
    expect(rows.data[0]).toMatchObject({ id: '42', day_type: 'DATE' });
    expect(rows.data[0]).not.toHaveProperty('omitted');
  });

  it('rejects non-array input', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(engine.load({ type: 'json', options: { data: {} as any } })).rejects.toThrow('Data must be an array');
  });
});
