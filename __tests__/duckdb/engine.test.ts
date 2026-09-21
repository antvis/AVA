/**
 * Unit tests for DuckDBEngine
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DuckDBEngine } from '../../src/duckdb';
import { QueryTimeoutError } from '../../src/duckdb/engine';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe('DuckDBEngine', () => {
  let engine: DuckDBEngine;

  beforeEach(() => {
    engine = new DuckDBEngine(getLLMConfig());
  });

  afterEach(async () => {
    await engine.dispose();
  });

  it('should load data and execute queries', async () => {
    const testData = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'SF' },
      { name: 'Charlie', age: 35, city: 'NYC' },
    ];

    await engine.load({ type: 'json', options: { data: testData } });

    const all = await engine.execute('SELECT * FROM data');
    expect(all.length).toBe(3);

    const filtered = await engine.execute("SELECT * FROM data WHERE city = 'NYC'");
    expect(filtered.length).toBe(2);

    const aggregated = await engine.execute('SELECT COUNT(*) as count FROM data');
    expect(aggregated[0].count).toBe(3);
  });

  describe('schema profiling', () => {
    it('should load a Parquet schema containing numeric arrays', async () => {
      const schema = await engine.load({
        type: 'parquet',
        options: { path: path.join(__dirname, '../datasets/041_Airline.parquet') },
      });

      expect(schema.tables[0]).toMatchObject({ name: 'data', rowCount: 5 });
      const field = schema.tables[0].fields.find(({ name }) => name === 'tweet_coord');
      expect(field).toMatchObject({
        name: 'tweet_coord',
        type: 'DOUBLE[]',
      });
      expect(field).not.toHaveProperty('min');
      expect(field).not.toHaveProperty('max');
    });

    it('should skip profiling when every column is an array', async () => {
      const schema = await engine.load({ type: 'json', options: { data: [{ values: ['a', 'b'] }] } });

      expect(schema.tables[0].fields[0]).toMatchObject({ type: 'VARCHAR[]' });
    });
  });

  it('should apply resource limits and still run normal queries', async () => {
    const limited = new DuckDBEngine(getLLMConfig(), {
      memoryLimit: '256MB',
      threads: 2,
      maxTempDirectorySize: '100MB',
    });
    try {
      await limited.load({ type: 'json', options: { data: [{ a: 1 }, { a: 2 }] } });
      const rows = await limited.execute('SELECT SUM(a) AS total FROM data');
      expect(rows[0].total).toBe(3);
    } finally {
      await limited.dispose();
    }
  });

  it('should abort a query that exceeds the configured timeout', async () => {
    const fast = new DuckDBEngine(getLLMConfig(), { queryTimeoutMs: 100 });
    try {
      await fast.load({ type: 'json', options: { data: [{ a: 1 }] } });
      // A large cross join is far slower than the 100ms timeout.
      const slowQuery =
        'SELECT COUNT(*) FROM range(100000) a, range(100000) b';
      await expect(fast.execute(slowQuery)).rejects.toThrow(QueryTimeoutError);
    } finally {
      await fast.dispose();
    }
  });

  it('should allow multiple read-only statements and reject writes', async () => {
    await engine.load({ type: 'json', options: { data: [{ a: 1 }] } });

    await expect(engine.execute('SELECT * FROM data; SELECT 1')).resolves.toEqual([{ a: 1 }]);
    await expect(engine.execute('CREATE TABLE blocked (a INTEGER)')).rejects.toThrow(
      'only read-only SELECT statements'
    );
    await expect(engine.execute('SELECT * FROM data; CREATE TABLE blocked_too (a INTEGER)')).rejects.toThrow(
      'only read-only SELECT statements'
    );
  });

  describe.skipIf(skipLLMTests)('getDSL', () => {
    it('should generate SQL from a natural language query', async () => {
      await engine.load({
        type: 'json',
        options: { data: [{ company: 'A', region: 'East', revenue: 100 }] },
      });

      const sql = await engine.getDSL('Show all companies');

      expect(typeof sql).toBe('string');
      expect(sql.toLowerCase()).toContain('select');
      expect(sql.toLowerCase()).toContain('from');
    }, 30000);
  });
});
