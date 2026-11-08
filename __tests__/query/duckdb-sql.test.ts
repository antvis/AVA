import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { DuckDBSQLDialect } from '../../src/query/duckdb-sql';
import { sqlStringLiteral } from '../../src/util/sql';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', async (original) => ({
  ...(await original<typeof import('../../src/util/model')>()),
  languageModel: vi.fn(() => 'test-model'),
}));
const parserState = vi.hoisted(() => ({ loads: 0 }));
vi.mock('@duckdb/node-api', async (importOriginal) => {
  parserState.loads += 1;
  return importOriginal();
});

const dialect = new DuckDBSQLDialect({ model: 'test' });

afterEach(async () => {
  await dialect.dispose();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('DuckDB SQL validation', () => {
  it('loads native parsing only when validating SQL', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', finishReason: 'stop' } as never);
    expect(parserState.loads).toBe(0);
    expect((await dialect.getDSL('one', { models: [] })).dsl).toBe('SELECT 1');
    expect(parserState.loads).toBe(0);
    await dialect.validateDSL('SELECT 1');
    expect(parserState.loads).toBe(1);
  });

  it('reuses an instance across concurrent validations and releases each connection', async () => {
    const { DuckDBInstance, DuckDBConnection } = await import('@duckdb/node-api');
    const create = vi.spyOn(DuckDBInstance, 'create');
    const closeConnection = vi.spyOn(DuckDBConnection.prototype, 'closeSync');
    const closeInstance = vi.spyOn(DuckDBInstance.prototype, 'closeSync');
    await Promise.all([dialect.validateDSL('SELECT 1'), dialect.validateDSL('SELECT 2')]);
    await expect(dialect.validateDSL('DROP TABLE orders')).rejects.toThrow();
    expect(create).toHaveBeenCalledTimes(1);
    expect(closeConnection).toHaveBeenCalledTimes(3);
    await dialect.dispose();
    await dialect.dispose();
    expect(closeInstance).toHaveBeenCalledTimes(1);
    await dialect.validateDSL('SELECT 3');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('can retry after native initialization fails', async () => {
    const { DuckDBInstance } = await import('@duckdb/node-api');
    vi.spyOn(DuckDBInstance, 'create').mockRejectedValueOnce(new Error('initialization failed'));
    await expect(dialect.validateDSL('SELECT 1')).rejects.toThrow('initialization failed');
    await expect(dialect.validateDSL('SELECT 1')).resolves.toBe('SELECT 1');
  });

  it('validates CTEs, subqueries and set operations without binding real tables', async () => {
    const sql = 'WITH q AS (SELECT * FROM missing_table) SELECT * FROM (SELECT * FROM q) UNION ALL SELECT 1';
    await expect(dialect.validateDSL(sql)).resolves.toBe(sql);
  });

  it.each([
    'SELECT 1 AS n UNION SELECT 1 AS n',
    'SELECT 1 AS n UNION ALL BY NAME SELECT 1 AS n',
    "SELECT 9223372036854775807 AS n, '中文😀; -- literal' AS text",
    'SELECT [x * 2 FOR x IN [1, 2, 3]]',
    'SELECT 1e2 AS n, typeof(1e2) AS kind',
    'SELECT (1e-1 + 1e-1 + 1e-1) = 0.3 AS matches',
    String.raw`/* outer ; /* nested ; */ */ SELECT E'it\';s' AS "semi;""column", $中文$; literal$中文$ AS text`,
  ])('preserves source, result types and semantics under row limits: %s', async (sql) => {
    const { DuckDBInstance } = await import('@duckdb/node-api');
    const instance = await DuckDBInstance.create(':memory:');
    try {
      const connection = await instance.connect();
      try {
        const input = `;; ${sql}; ; -- trailing comment`;
        const expected = await connection.runAndReadAll(sql);
        const validated = await dialect.validateDSL(input);
        const actual = await connection.runAndReadAll(`SELECT * FROM query(${sqlStringLiteral(validated)}) LIMIT 11`);
        expect(actual.getRowObjectsJson()).toEqual(expected.getRowObjectsJson());
        expect(actual.columnTypes().map(String)).toEqual(expected.columnTypes().map(String));
        expect(validated).toBe(input);
      } finally {
        connection.closeSync();
      }
    } finally {
      instance.closeSync();
    }
  });

  it('rejects input truncated by a NUL character', async () => {
    await expect(dialect.validateDSL('SELECT 1\0; DELETE FROM data')).rejects.toThrow('NUL');
  });

  it.each([
    'SELECT (',
    'SELECT 1; SELECT 2',
    'DROP TABLE orders',
    "COPY (SELECT 1) TO '/tmp/ava-must-not-write'",
    'WITH q AS (DELETE FROM orders RETURNING *) SELECT * FROM q',
    "SELECT 1 INTO '/tmp/ava-must-not-write'",
    'SELECT 1 FOR UPDATE',
    'SET enable_external_access = true',
  ])('rejects invalid, mutating or restricted SQL: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('read-only SELECT statement');
  });
});

describe('DuckDB SQL generation', () => {
  it('extracts SQL and preserves usage and model context', async () => {
    const sql = "SELECT '```' AS value";
    const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
    vi.mocked(generateText).mockResolvedValue({ text: `\`\`\`sql\n${sql}\n\`\`\``, usage, finishReason: 'stop' } as never);
    const result = await new DuckDBSQLDialect({ model: 'test', maxRetries: 0 }).getDSL('count orders', {
      models: [{ name: 'orders', columns: [], metrics: { row_count: 42 } }],
    });
    expect(result).toEqual({ dsl: sql, usage });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, prompt: expect.stringContaining('orders') })
    );
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('42');
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('count orders');
  });

  it.each([
    { text: 'SELECT 1', finishReason: 'length', error: 'did not complete' },
    { text: '```sql\n\n```', finishReason: 'stop', error: 'empty query' },
  ])('rejects unusable generation: $error', async ({ text, finishReason, error }) => {
    vi.mocked(generateText).mockResolvedValue({ text, finishReason } as never);
    await expect(dialect.getDSL('one', { models: [] })).rejects.toThrow(error);
  });
});
