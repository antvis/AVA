/**
 * Unit and integration tests for the SQL Server remote engine. All tests run
 * against the built-in in-memory mock connector — no live SQL Server or
 * network access is required. They cover schema discovery, read-only query
 * execution, row-limit handling, error handling, and resource disposal.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../src';
import { MockQueryConnector, SqlServerEngine, validateReadOnlySqlServer } from '../../src/remote/sqlserver';
import { SQLSERVER_TABLE_SEED } from '../../src/remote/sqlserver/examples';
import { BUILTIN_METRICS as SQL_SERVER_METRICS, profileTables as sqlServerProfile } from '../../src/remote/sqlserver/profile';
import { getLLMConfig } from '../test-utils';

import type { Schema } from '../../src/types';

const MOCK_SOURCE = {
  type: 'sqlserver' as const,
  options: {
    server: 'localhost',
    database: 'demo',
    user: 'sa',
    password: 'secret',
    adapter: 'mock' as const,
    tables: SQLSERVER_TABLE_SEED,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('validateReadOnlySqlServer', () => {
  it.each([
    ['SELECT TOP 10 * FROM orders', true],
    ['WITH x AS (SELECT 1 AS a) SELECT * FROM x', true],
    ['select region, sum(units) from orders group by region', true],
    ['SELECT * FROM orders; -- trailing comment', true],
    ["SELECT * FROM orders WHERE product = 'select from' AND region = 'drop'", true],
  ])('accepts %s', (sql, ok) => {
    if (ok) expect(() => validateReadOnlySqlServer(sql)).not.toThrow();
  });

  it('accepts a SELECT with an atomic UPDATE/INSERT-free fragment inside a string literal', () => {
    expect(() => validateReadOnlySqlServer("SELECT * FROM orders WHERE note = 'INSERT INTO x'")).not.toThrow();
  });

  it.each([
    'DELETE FROM orders',
    'UPDATE orders SET region = 1',
    'INSERT INTO orders VALUES (1)',
    'DROP TABLE orders',
    'CREATE TABLE t (id int)',
    'EXEC sp_help',
    'SELECT 1; DROP TABLE orders',
    'SELECT * FROM (SELECT 1) x; DELETE FROM t',
  ])('rejects %s', (sql) => {
    expect(() => validateReadOnlySqlServer(sql)).toThrow();
  });
});

describe('SqlServerEngine (mock adapter)', () => {
  it('rejects an unloaded engine and incompatible sources', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    try {
      await expect(engine.schema()).rejects.toThrow('No data loaded');
      await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
    } finally {
      await engine.dispose();
    }

    // Now load and try a mismatched source type.
    const loaded = new SqlServerEngine(getLLMConfig());
    try {
      await expect(
        loaded.load({ type: 'csv-file', options: { path: 'unused' } })
      ).rejects.toThrow("only supports 'sqlserver'");
      await expect(loaded.schema()).rejects.toThrow('No data loaded');
    } finally {
      await loaded.dispose();
    }
  });

  it('discovers tables and columns through INFORMATION_SCHEMA', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const schema = await engine.schema();
      const names = schema.models.map((m) => m.name);
      expect(names).toEqual(['CUSTOMERS', 'ORDERS']);

      const orders = schema.models.find((m) => m.name === 'ORDERS')!;
      expect(orders.columns).toEqual(
        expect.arrayContaining([
          { name: 'ORDERID', type: 'int', notNull: true },
          { name: 'REGION', type: 'nvarchar', notNull: false },
        ])
      );
      expect(orders.primaryKey).toBe('ORDERID');
    } finally {
      await engine.dispose();
    }
  });

  it('executes a bounded read-only query through the mock connector', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const result = await engine.execute('SELECT Region, SUM(Units) AS TotalUnits FROM orders GROUP BY Region');
      expect(result.data).toEqual([
        { Region: 'North', TotalUnits: 12 },
        { Region: 'South', TotalUnits: 17 },
        { Region: 'West', TotalUnits: 11 },
      ]);
      expect(result.rowCount).toBe(3);
    } finally {
      await engine.dispose();
    }
  });

  it('caps rows to the configured limit and flags truncation', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      // 6 orders; ask for 3.
      const result = await engine.execute('SELECT * FROM orders', { maxRows: 3 });
      expect(result.data).toHaveLength(3);
      expect(result.truncated).toBe(true);
      expect(result.truncatedBy).toBe('maxRows');
    } finally {
      await engine.dispose();
    }
  });

  it('lets query errors propagate with a clear message', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      await expect(engine.execute('SELECT * FROM missing_table')).rejects.toThrow("Invalid object name");
    } finally {
      await engine.dispose();
    }
  });

  it('rejects write statements before execution', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      await expect(engine.execute('DELETE FROM orders')).rejects.toThrow('read-only');
      await expect(engine.execute('UPDATE orders SET region = 2')).rejects.toThrow('read-only');
    } finally {
      await engine.dispose();
    }
  });

  it('dispose releases the connector so further calls fail cleanly', async () => {
    const engine = new SqlServerEngine(getLLMConfig());
    await engine.load(MOCK_SOURCE);
    await engine.dispose();
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
  });

  it('integrates with AVA end-to-end', async () => {
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'sqlserver' } });
    try {
      await ava.source(MOCK_SOURCE);
      expect(ava.engine!.language).toEqual({ name: 'Microsoft T-SQL dialect', fence: 'sql' });

      const schema = await ava.schema();
      expect(schema.models.some((m) => m.name === 'ORDERS')).toBe(true);

      const result = await ava.query('SELECT COUNT(*) AS N FROM orders');
      expect(result.data).toEqual([{ N: 6 }]);
    } finally {
      await ava.dispose();
    }
  });
});

describe('SqlServerEngine profile', () => {
  const schema: Schema = {
    models: [
      {
        name: 'orders',
        tableReference: { catalog: 'demo', table: 'orders' },
        columns: [
          { name: 'Units', type: 'int', notNull: true },
          { name: 'Region', type: 'nvarchar', notNull: false },
        ],
      },
    ],
  };

  it('computes numeric metrics from a single aggregate query', async () => {
    const run = vi
      .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
      .mockResolvedValue([{ m0: '6', m1: '12.5' }]);
    const result = await sqlServerProfile(run, schema, { metrics: [{ id: 'row_count' }, { id: 'mean' }] });
    expect(run).toHaveBeenCalledTimes(1);
    expect(result.models[0].metrics.row_count).toBe(6);
    expect(result.models[0].columns[0].metrics.mean).toBe(12.5);
    const query = run.mock.calls[0][0];
    expect(query).toContain('AVG(CAST("Units" AS float))');
    expect(query).not.toContain('CREATE');
  });

  it('propagates query failures', async () => {
    await expect(
      sqlServerProfile(
        async () => {
          throw new Error('profile query failed');
        },
        schema,
        { metrics: [{ id: 'row_count' }] }
      )
    ).rejects.toThrow('profile query failed');
  });

  it('rejects malformed top-values and throws on unknown metrics', async () => {
    const bad = vi.fn<any>().mockResolvedValue([{ m0: 'not-json' }]);
    await expect(
      sqlServerProfile(bad, schema, { metrics: [{ id: 'top_values' }] })
    ).rejects.toThrow('Invalid SQL Server top_values');

    const run = vi.fn<any>().mockResolvedValue([{}]);
    await expect(sqlServerProfile(run, schema, { metrics: [{ id: 'missing' }] })).rejects.toThrow('Unknown metric');
    expect(run).not.toHaveBeenCalled();
  });

  it('exposes an identical metric id set across engines for parity', () => {
    const ids = SQL_SERVER_METRICS.map((m) => m.id).sort();
    expect(ids).toEqual(['distinct_count', 'duplicate_count', 'max', 'max_length', 'mean', 'min', 'min_length', 'null_count', 'row_count', 'stddev', 'sum', 'top_values']);
  });
});

describe('MockQueryConnector', () => {
  it('is the production-independent default when adapter is mock', async () => {
    const connector = new MockQueryConnector({ database: 'demo', tables: SQLSERVER_TABLE_SEED } as never);
    await connector.connect();
    const result = await connector.query('SELECT * FROM INFORMATION_SCHEMA.TABLES');
    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    await connector.close();
    // After close, connect() re-seeds.
    await connector.connect();
    const again = await connector.query('SELECT Region FROM orders WHERE Region = \'North\'');
    expect(again.rows.length).toBeGreaterThan(0);
    await connector.close();
  });
});