/**
 * Unit tests for DuckDBEngine
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { DuckDBEngine } from '../../src/duckdb';
import { buildDataModel } from '../../src/util/data-model';
import { QueryTimeoutError } from '../../src/duckdb/engine';
import { DuckDBQueryDialect } from '../../src/query/duckdb';
import { maxRows } from '../../src/util/result';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe('DuckDBEngine', () => {
  it('requires a loaded source for schema discovery', async () => {
    const engine = new DuckDBEngine(getLLMConfig());
    try {
      await expect(engine.schema()).rejects.toThrow('No data loaded');
    } finally {
      await engine.dispose();
    }
  });

  let engine: DuckDBEngine;

  beforeEach(() => {
    engine = new DuckDBEngine(getLLMConfig());
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await engine.dispose();
  });

  it('uses caller-supplied context without retaining schema or profile', async () => {
    const generate = vi.spyOn(DuckDBQueryDialect.prototype, 'getDSL').mockResolvedValue('SELECT 1');
    const compute = vi.spyOn(engine, 'profile');
    await engine.load({ type: 'json', options: { data: [{ value: 1 }] } });
    const schema = await engine.schema();
    await engine.getDSL('One', schema);
    expect(generate).toHaveBeenLastCalledWith('One', schema);
    expect(compute).not.toHaveBeenCalled();

    const profile = await engine.profile(schema, { metrics: ['row_count'] });
    await engine.getDSL('One', buildDataModel({ schema, profile }));
    expect(generate).toHaveBeenLastCalledWith('One', buildDataModel({ schema, profile }));
    expect(compute).toHaveBeenCalledTimes(1);
    await engine.getDSL('One', schema);
    expect(generate).toHaveBeenLastCalledWith('One', schema);

    await engine.dispose();
    await expect(engine.getDSL('One', schema)).rejects.toThrow('No data loaded');
    await engine.load({ type: 'json', options: { data: [{ other: 2 }] } });
    const nextSchema = await engine.schema();
    await engine.getDSL('Two', nextSchema);
    expect(generate).toHaveBeenLastCalledWith('Two', nextSchema);
  });

  it('should load data and execute queries', async () => {
    const testData = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'SF' },
      { name: 'Charlie', age: 35, city: 'NYC' },
    ];

    await engine.load({ type: 'json', options: { data: testData } });
    const schema = await engine.schema();
    expect(schema.models).toEqual([
      {
        name: 'data',
        columns: [
          { name: 'name', type: 'VARCHAR', notNull: false },
          { name: 'age', type: 'BIGINT', notNull: false },
          { name: 'city', type: 'VARCHAR', notNull: false },
        ],
        tableReference: { catalog: 'memory', schema: 'main', table: 'data' },
      },
    ]);
    expect(schema.relationships).toEqual([]);

    const all = await engine.execute('SELECT * FROM data');
    expect(all.data).toHaveLength(3);

    const filtered = await engine.execute("SELECT * FROM data WHERE city = 'NYC'");
    expect(filtered.data).toHaveLength(2);

    const aggregated = await engine.execute('SELECT COUNT(*) as count FROM data');
    expect(aggregated.data[0].count).toBe(3);
  });

  describe('structural schema', () => {
    it('should load a Parquet schema containing numeric arrays', async () => {
      await engine.load({
        type: 'parquet',
        options: { path: path.join(__dirname, '../datasets/041_Airline.parquet') },
      });
      const schema = await engine.schema();

      expect(schema.models[0]).toMatchObject({ name: 'data' });
      expect(schema.models[0]).not.toHaveProperty('rowCount');
      const field = schema.models[0].columns.find(({ name }) => name === 'tweet_coord');
      expect(field).toMatchObject({ name: 'tweet_coord', type: 'DOUBLE[]' });
      expect(field).not.toHaveProperty('min');
      expect(field).not.toHaveProperty('max');
    });

    it('should return structural metadata when every column is an array', async () => {
      await engine.load({ type: 'json', options: { data: [{ values: ['a', 'b'] }] } });
      const schema = await engine.schema();

      expect(schema.models[0].columns[0]).toMatchObject({ type: 'VARCHAR[]' });
    });
  });

  it('should bound large query results', async () => {
    await engine.load({ type: 'json', options: { data: Array.from({ length: 5 }, (_, id) => ({ id })) } });

    const result = await engine.execute<{ id: number }>('SELECT * FROM data ORDER BY id', { maxRows: 2 });

    expect(result.data).toEqual([{ id: 0 }, { id: 1 }]);
    expect(result.truncated).toBe(true);
    expect(result.rowCount).toBeUndefined();
    expect(result.schema).toEqual([{ name: 'id', type: 'BIGINT' }]);
  });

  it('should normalize result limits with a one-million-row cap', () => {
    expect(maxRows({ maxRows: 0 })).toBe(1);
    expect(maxRows({ maxRows: 1_000_001 })).toBe(1_000_000);
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

  it('should keep community extensions disabled for ordinary sources', async () => {
    const create = vi.spyOn(DuckDBInstance, 'create');
    const basic = new DuckDBEngine(getLLMConfig());
    try {
      await basic.load({ type: 'json', options: { data: [{ a: 1 }] } });
      expect(create).toHaveBeenLastCalledWith(
        ':memory:',
        expect.objectContaining({ allow_community_extensions: 'false' })
      );
    } finally {
      await basic.dispose();
    }
  });

  it('should allow community extensions when enabled for the engine', async () => {
    const create = vi.spyOn(DuckDBInstance, 'create');
    const mongo = new DuckDBEngine(getLLMConfig(), { allowCommunityExtensions: true });
    try {
      await mongo.load({ type: 'json', options: { data: [{ a: 1 }] } });
      expect(create).toHaveBeenLastCalledWith(
        ':memory:',
        expect.objectContaining({ allow_community_extensions: 'true' })
      );
    } finally {
      await mongo.dispose();
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

  describe.skipIf(skipLLMTests)('getDSL', () => {
    it('should generate SQL from a natural language query', async () => {
      await engine.load({ type: 'json', options: { data: [{ company: 'A', region: 'East', revenue: 100 }] } });

      const sql = await engine.getDSL('Show all companies', await engine.schema());

      expect(typeof sql).toBe('string');
      expect(sql.toLowerCase()).toContain('select');
      expect(sql.toLowerCase()).toContain('from');
    }, 30000);
  });
});
