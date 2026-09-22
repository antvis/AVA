/**
 * Unit tests for DuckDBEngine
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { DuckDBEngine } from '../../src/duckdb';
import { QueryTimeoutError } from '../../src/duckdb/engine';
import { maxRows } from '../../src/util/result';
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

    const reads = vi.spyOn(DuckDBConnection.prototype, 'runAndReadAll');
    const schema = await engine.load({ type: 'json', options: { data: testData } });
    // duckdb_columns() + duckdb_constraints() + duckdb_indexes() — all in catalog queries.
    expect(reads.mock.calls).toHaveLength(3);
    expect(reads.mock.calls[0][0]).toContain('duckdb_columns()');
    expect(reads.mock.calls[1][0]).toContain('duckdb_constraints()');
    expect(reads.mock.calls[2][0]).toContain('duckdb_indexes()');
    expect(schema.tables).toEqual([
      {
        name: 'data',
        columnCount: 3,
        fields: [
          { name: 'name', type: 'VARCHAR', nullable: true },
          { name: 'age', type: 'BIGINT', nullable: true },
          { name: 'city', type: 'VARCHAR', nullable: true },
        ],
        indexes: [],
      },
    ]);
    reads.mockRestore();

    const all = await engine.execute('SELECT * FROM data');
    expect(all.data).toHaveLength(3);

    const filtered = await engine.execute("SELECT * FROM data WHERE city = 'NYC'");
    expect(filtered.data).toHaveLength(2);

    const aggregated = await engine.execute('SELECT COUNT(*) as count FROM data');
    expect(aggregated.data[0].count).toBe(3);
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

  it('should bound large query results', async () => {
    await engine.load({
      type: 'json',
      options: { data: Array.from({ length: 5 }, (_, id) => ({ id })) },
    });

    const result = await engine.execute<{ id: number }>('SELECT * FROM data ORDER BY id', {
      maxRows: 2,
    });

    expect(result.data).toEqual([{ id: 0 }, { id: 1 }]);
    expect(result.truncated).toBe(true);
    expect(result.rowCount).toBeUndefined();
    expect(result.schema).toEqual([{ name: 'id', type: 'BIGINT' }]);
  });

  it('should clamp result limits', () => {
    expect(maxRows({ maxRows: 0 })).toBe(1);
    expect(maxRows({ maxRows: 10_001 })).toBe(10_000);
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
      expect(rows.data[0].total).toBe(3);
    } finally {
      await limited.dispose();
    }
  });

  it('should abort a query that exceeds the configured timeout', async () => {
    const fast = new DuckDBEngine(getLLMConfig(), { queryTimeoutMs: 100 });
    try {
      await fast.load({ type: 'json', options: { data: [{ a: 1 }] } });
      // A large cross join is far slower than the 100ms timeout.
      const slowQuery = 'SELECT COUNT(*) FROM range(100000) a, range(100000) b';
      await expect(fast.execute(slowQuery)).rejects.toThrow(QueryTimeoutError);
    } finally {
      await fast.dispose();
    }
  });

  it('should require one read-only statement', async () => {
    await engine.load({ type: 'json', options: { data: [{ a: 1 }] } });

    await expect(engine.execute('SELECT * FROM data; SELECT 1')).rejects.toThrow('exactly one');
    await expect(engine.execute('CREATE TABLE blocked (a INTEGER)')).rejects.toThrow(
      'only read-only SELECT statements'
    );
    await expect(engine.execute('SELECT * FROM data; CREATE TABLE blocked_too (a INTEGER)')).rejects.toThrow(
      'only read-only SELECT statements'
    );
  });

  it('should generate DSL from structural metadata without implicit profiling', async () => {
    await engine.load({ type: 'json', options: { data: [{ amount: 10 }] } });
    const reads = vi.spyOn(DuckDBConnection.prototype, 'runAndReadAll');
    const generate = vi.spyOn(DuckDBQueryDialect.prototype, 'getDSL').mockResolvedValue('SELECT * FROM data');
    try {
      expect(await engine.getDSL('Show data')).toBe('SELECT * FROM data');
      expect(reads.mock.calls).toHaveLength(3);
      expect(reads.mock.calls[0][0]).toContain('duckdb_columns()');
      expect(reads.mock.calls[1][0]).toContain('duckdb_constraints()');
      expect(reads.mock.calls[2][0]).toContain('duckdb_indexes()');
      expect(generate).toHaveBeenCalledWith('Show data', {
        tables: [
          {
            name: 'data',
            columnCount: 1,
            fields: [{ name: 'amount', type: 'BIGINT', nullable: true }],
            indexes: [],
          },
        ],
      });
    } finally {
      reads.mockRestore();
      generate.mockRestore();
    }
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
