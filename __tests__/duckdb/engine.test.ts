/**
 * Unit tests for DuckDBEngine
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { DuckDBEngine } from '../../src/duckdb';
import { QueryTimeoutError } from '../../src/duckdb/engine';
import { DuckDBQueryDialect } from '../../src/query/duckdb';
import { maxRows } from '../../src/util/result';
import { getLLMConfig, skipLLMTests } from '../test-utils';

import { OFFLINE_LLM, nativeQuery } from './test-utils';

describe('DuckDBEngine', () => {
  let engine: DuckDBEngine;

  beforeEach(() => {
    engine = new DuckDBEngine(getLLMConfig());
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await engine.dispose();
  });

  it('uses its own schema and explicitly computed profile when generating DSL', async () => {
    const generate = vi.spyOn(DuckDBQueryDialect.prototype, 'getDSL').mockResolvedValue('SELECT 1');
    const compute = vi.spyOn(engine, 'profile');
    const schema = await engine.load({ type: 'json', options: { data: [{ value: 1 }] } });
    await engine.getDSL('One');
    expect(generate).toHaveBeenLastCalledWith('One', { schema, profile: undefined });
    expect(compute).not.toHaveBeenCalled();

    const profile = await engine.profile({ metrics: ['row_count'] });
    await engine.getDSL('One');
    expect(generate).toHaveBeenLastCalledWith('One', { schema, profile });
    expect(compute).toHaveBeenCalledTimes(1);

    await engine.dispose();
    await expect(engine.getDSL('One')).rejects.toThrow('No data loaded');
    const nextSchema = await engine.load({ type: 'json', options: { data: [{ other: 2 }] } });
    await engine.getDSL('Two');
    expect(generate).toHaveBeenLastCalledWith('Two', { schema: nextSchema, profile: undefined });
  });

  it('should load data and execute queries', async () => {
    const testData = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'SF' },
      { name: 'Charlie', age: 35, city: 'NYC' },
    ];

    const schema = await engine.load({ type: 'json', options: { data: testData } });
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
    expect(schema.relations).toEqual([]);

    const all = await engine.execute('SELECT * FROM data');
    expect(all.data).toHaveLength(3);

    const filtered = await engine.execute("SELECT * FROM data WHERE city = 'NYC'");
    expect(filtered.data).toHaveLength(2);

    const aggregated = await engine.execute('SELECT COUNT(*) as count FROM data');
    expect(aggregated.data[0].count).toBe(3);
  });

  describe('structural schema', () => {
    it('should load a Parquet schema containing numeric arrays', async () => {
      const schema = await engine.load({
        type: 'parquet',
        options: { path: path.join(__dirname, '../datasets/041_Airline.parquet') },
      });

      expect(schema.tables[0]).toMatchObject({ name: 'data', columnCount: 15 });
      expect(schema.tables[0]).not.toHaveProperty('rowCount');
      const field = schema.tables[0].fields.find(({ name }) => name === 'tweet_coord');
      expect(field).toMatchObject({
        name: 'tweet_coord',
        type: 'DOUBLE[]',
      });
      expect(field).not.toHaveProperty('min');
      expect(field).not.toHaveProperty('max');
    });

    it('should return structural metadata when every column is an array', async () => {
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

// execute() returns a bounded result with native schema metadata and numeric
// coercion. These tests use safely representable numbers; the API does not
// expose a lossless numeric mode or an unbounded result option.
describe('DuckDBEngine execution results', () => {
  let engine: DuckDBEngine;
  let directory: string;
  let csvPath: string;
  beforeEach(async () => {
    engine = new DuckDBEngine(OFFLINE_LLM);
    directory = await mkdtemp(path.join(tmpdir(), 'ava-csv-test-'));
    csvPath = path.join(directory, 'source.csv');
    await writeFile(csvPath, 'name\nAlice\n');
    await engine.load({ type: 'csv-file', options: { path: csvPath } });
  });
  afterEach(async () => {
    try {
      await engine?.dispose();
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  });

  it.each([
    { expression: "'123'::VARCHAR", value: 123, type: 'VARCHAR' },
    { expression: "'001'::VARCHAR", value: '001', type: 'VARCHAR' },
    { expression: "'-0'::VARCHAR", value: -0, type: 'VARCHAR' },
    { expression: "'1e3'::VARCHAR", value: '1e3', type: 'VARCHAR' },
    { expression: '9007199254740991::BIGINT', value: Number.MAX_SAFE_INTEGER, type: 'BIGINT' },
    { expression: '12345.125::DECIMAL(12,3)', value: 12345.125, type: 'DECIMAL(12,3)' },
    { expression: '42::INTEGER', value: 42, type: 'INTEGER' },
    { expression: 'true::BOOLEAN', value: true, type: 'BOOLEAN' },
    { expression: 'NULL::VARCHAR', value: null, type: 'VARCHAR' },
  ])('returns numeric values and native metadata for $expression', async ({ expression, value, type }) => {
    const result = await engine.execute(`SELECT ${expression} AS value`);
    expect(result.schema).toEqual([{ name: 'value', type }]);
    expect(result.data).toEqual([{ value }]);
    expect(result.rowCount).toBe(1);
    expect(result.truncated).toBeUndefined();
  });

  it('preserves leading-zero strings while coercing numeric strings from a CSV file', async () => {
    await engine.dispose();
    await writeFile(csvPath, 'code\n123\n001\n');
    await engine.load({ type: 'csv-file', options: { path: csvPath, options: { header: true, all_varchar: true } } });
    const result = await engine.execute('SELECT * FROM data ORDER BY code');
    expect(result.schema).toEqual([{ name: 'code', type: 'VARCHAR' }]);
    expect(result.data).toEqual([{ code: '001' }, { code: 123 }]);
  });

  it.each([
    'SELECT 1 AS x;',
    'SELECT 1 AS x; -- trailing comment',
    'SELECT 1 AS x; /* trailing comment */',
    'SELECT 1 AS x\n-- no semicolon',
  ])('executes one valid SELECT with comments: %s', async (sql) => {
    // Valid single-statement SQL remains part of the current query contract.
    // Do not assert rejection just because the result wrapper mishandles it.
    expect((await engine.execute(sql)).data).toEqual((await nativeQuery(sql)).data);
  });

  it('keeps result schema names consistent with row keys for duplicate aliases', async () => {
    const result = await engine.execute('SELECT 1 AS x, 2 AS x');
    const names = result.schema.map(({ name }) => name);
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
    expect(Object.keys(result.data[0])).toEqual(names);
    expect(Object.values(result.data[0])).toEqual([1, 2]);
  });

  it.each([0, 1, 200, 201, 10000, 10001])('applies explicit maxRows and the hard cap to %i rows', async (count) => {
    const result = await engine.execute(`SELECT i::INTEGER AS n FROM range(${count}) t(i) ORDER BY n`, {
      maxRows: Math.max(count, 1),
      maxResultBytes: 4 * 1024 * 1024,
    });
    const returned = Math.min(count, 10000);
    expect(result.data).toEqual(Array.from({ length: returned }, (_, n) => ({ n })));
    if (count > 10000) {
      expect(result.truncated).toBe(true);
      expect(result.truncatedBy).toBe('maxRows');
      expect(result.rowCount).toBeUndefined();
    } else {
      expect(result.truncated).toBeUndefined();
      expect(result.rowCount).toBe(count);
    }
  });

  it('defaults to 200 rows and leaves total rowCount unknown on truncation', async () => {
    const result = await engine.execute('SELECT i::INTEGER AS n FROM range(201) t(i) ORDER BY n');
    expect(result.data).toEqual(Array.from({ length: 200 }, (_, n) => ({ n })));
    expect(result.truncated).toBe(true);
    expect(result.truncatedBy).toBe('maxRows');
    expect(result.rowCount).toBeUndefined();
  });

  it.each(['x', '中'])('honors a sufficient explicit byte budget for a multi-row %s result', async (char) => {
    const result = await engine.execute(`SELECT repeat('${char}', 16384) AS value FROM range(100)`, {
      maxRows: 100,
      maxResultBytes: 8 * 1024 * 1024,
    });
    expect(result.truncated).toBeUndefined();
    expect(result.rowCount).toBe(100);
    expect(result.data).toEqual(Array.from({ length: 100 }, () => ({ value: char.repeat(16384) })));
  });

  it.each(['x', '中'])('reports byte truncation independently of row truncation for %s', async (char) => {
    const row = { value: char.repeat(16384) };
    const expectedCount = Math.floor((1024 * 1024) / Buffer.byteLength(JSON.stringify(row), 'utf8'));
    const result = await engine.execute(`SELECT repeat('${char}', 16384) AS value FROM range(100)`, {
      maxRows: 100,
    });
    expect(result.data).toEqual(Array.from({ length: expectedCount }, () => row));
    expect(result.truncated).toBe(true);
    expect(result.truncatedBy).toBe('maxResultBytes');
    expect(result.rowCount).toBeUndefined();
  });

  it.each([1024 * 1024 - 3, 1024 * 1024 - 2, 1024 * 1024 - 1, 1024 * 1024 + 1])(
    'enforces the serialized field-size limit for a %i-byte ASCII value',
    async (length) => {
      // JSON string quotes count toward the field limit; a larger overall byte
      // budget does not override the independent per-field safety check.
      const sql = `SELECT repeat('x', ${length}) AS value`;
      const operation = engine.execute(sql, { maxRows: 1, maxResultBytes: 4 * 1024 * 1024 });
      if (length + 2 > 1024 * 1024) {
        await expect(operation).rejects.toThrow('Result field exceeds the 1 MiB limit');
      } else {
        const result = await operation;
        expect(result.data).toEqual([{ value: 'x'.repeat(length) }]);
        expect(result.truncated).toBeUndefined();
      }
    }
  );

  it('retains duplicate rows and explicit ordering', async () => {
    const sql = "SELECT * FROM (VALUES ('Bob'), ('Alice'), ('Alice')) t(name) ORDER BY name";
    expect((await engine.execute(sql)).data).toEqual((await nativeQuery(sql)).data);
  });

  it.each(['SELECT 1; SELECT 2', 'CREATE TABLE forbidden(x INTEGER)', 'SET threads=2'])(
    'rejects non-single-read-only execution: %s',
    async (sql) => {
      await expect(engine.execute(sql)).rejects.toThrow();
      expect((await engine.execute('SELECT name FROM data')).data).toEqual([{ name: 'Alice' }]);
    }
  );
});
