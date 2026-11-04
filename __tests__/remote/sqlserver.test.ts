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
import { BUILTIN_METRICS as SQL_SERVER_METRICS, logicalType, profileTables as sqlServerProfile } from '../../src/remote/sqlserver/profile';
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
    // A stray closing paren escapes the row-limit wrapper and appends a
    // semicolon-free SELECT INTO statement.
    'SELECT 1 AS a) AS t SELECT 1 AS b INTO dbo.ava_write_probe FROM (SELECT 1 AS c',
    'SELECT 1 AS a) AS t SELECT 1 AS b FROM (SELECT 1 AS c',
    'SELECT 1 AS a FROM (SELECT 1 AS b) AS t SELECT 1 AS c',
    'SELECT * INTO dbo.ava_write_probe FROM orders',
  ])('rejects %s', (sql) => {
    expect(() => validateReadOnlySqlServer(sql)).toThrow();
  });

  it('accepts UNION and CTE queries', () => {
    expect(() => validateReadOnlySqlServer('SELECT 1 UNION ALL SELECT 2')).not.toThrow();
    expect(() => validateReadOnlySqlServer('WITH x AS (SELECT 1 AS a) SELECT * FROM x')).not.toThrow();
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

  it('classifies bit as boolean instead of numeric', async () => {
    expect(logicalType('bit')).toBe('boolean');

    const flags: Schema = {
      models: [
        {
          name: 'flags',
          tableReference: { catalog: 'demo', table: 'flags' },
          columns: [{ name: 'IsActive', type: 'bit', notNull: true }],
        },
      ],
    };
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockResolvedValue([
      { m0: '[{"value":"true","count":2}]' },
    ]);
    const result = await sqlServerProfile(run, flags, { metrics: [{ id: 'top_values' }] });
    expect(result.models[0].columns[0].properties.logicalType).toBe('boolean');
    expect(result.models[0].columns[0].metrics.top_values).toEqual([{ value: 'true', count: 2 }]);
  });

  it('keeps the time component in date bounds and escapes JSON with STRING_ESCAPE', async () => {
    const dated: Schema = {
      models: [
        {
          name: 'events',
          tableReference: { catalog: 'demo', table: 'events' },
          columns: [{ name: 'At', type: 'datetime2', notNull: true }],
        },
      ],
    };
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockResolvedValue([{ m0: '0', m1: '0' }]);
    await sqlServerProfile(run, dated, { metrics: [{ id: 'min' }, { id: 'max' }] });
    const query = run.mock.calls[0][0];
    expect(query).toContain('DATEDIFF_BIG(millisecond');
    expect(query).not.toContain('DATEDIFF_BIG(day');

    const runTop = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockResolvedValue([{ m0: '[]' }]);
    await sqlServerProfile(runTop, schema, { metrics: [{ id: 'top_values' }] });
    const topQuery = runTop.mock.calls[0][0];
    expect(topQuery).toContain("STRING_ESCAPE(CAST(v AS nvarchar(max)), 'json')");
    expect(topQuery).not.toContain('REPLACE(CAST(v AS nvarchar(max))');
  });

  it('converts legacy text/ntext/xml columns to nvarchar(max) for metrics', async () => {
    const legacy: Schema = {
      models: [
        {
          name: 'docs',
          tableReference: { catalog: 'demo', table: 'docs' },
          columns: [{ name: 'Body', type: 'text', notNull: false }],
        },
      ],
    };
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockResolvedValue([{ m0: '1' }]);
    await sqlServerProfile(run, legacy, { metrics: [{ id: 'distinct_count' }] });
    expect(run.mock.calls[0][0]).toContain('COUNT(DISTINCT CAST("Body" AS nvarchar(max)))');
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

describe('MockQueryConnector query semantics', () => {
  it('rejects a standalone closing bracket instead of hanging', async () => {
    const connector = new MockQueryConnector({ database: 'demo', tables: SQLSERVER_TABLE_SEED } as never);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const started = Date.now();
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('malformed query timed out')), 1000);
      });
      await expect(Promise.race([connector.query('SELECT ]'), timeout])).rejects.toThrow(
        /Unsupported SQL Server syntax|Unexpected token/
      );
      expect(Date.now() - started).toBeLessThan(1000);
    } finally {
      if (timer) clearTimeout(timer);
      await connector.close();
    }
  });

  it('evaluates HAVING instead of silently dropping it', async () => {
    const connector = new MockQueryConnector({ database: 'demo', tables: SQLSERVER_TABLE_SEED } as never);
    try {
      const none = await connector.query(
        'SELECT Region, SUM(Units) AS n FROM orders GROUP BY Region HAVING SUM(Units) > 100'
      );
      expect(none.rows).toEqual([]);

      const all = await connector.query(
        'SELECT Region, SUM(Units) AS n FROM orders GROUP BY Region HAVING SUM(Units) > 10 ORDER BY Region'
      );
      expect(all.rows).toEqual([
        { Region: 'North', n: 12 },
        { Region: 'South', n: 17 },
        { Region: 'West', n: 11 },
      ]);
    } finally {
      await connector.close();
    }
  });

  it('rejects unsupported HAVING forms with a clear error', async () => {
    const connector = new MockQueryConnector({ database: 'demo', tables: SQLSERVER_TABLE_SEED } as never);
    try {
      await expect(
        connector.query('SELECT Region FROM orders GROUP BY Region HAVING Region = \'North\'')
      ).rejects.toThrow('HAVING supports aggregate expressions only');
    } finally {
      await connector.close();
    }
  });

  it('applies AND before OR in mixed predicates', async () => {
    const connector = new MockQueryConnector({ database: 'demo', tables: SQLSERVER_TABLE_SEED } as never);
    try {
      const result = await connector.query(
        "SELECT OrderID FROM orders WHERE Region = 'North' OR Region = 'South' AND Units > 10 ORDER BY OrderID"
      );
      expect(result.rows.map((row) => row.OrderID)).toEqual([1, 3, 5]);
    } finally {
      await connector.close();
    }
  });

  it('preserves the full ordered composite primary key', async () => {
    const connector = new MockQueryConnector({
      database: 'demo',
      tables: [
        {
          name: 'order_lines',
          columns: [
            { name: 'OrderID', type: 'int', notNull: true },
            { name: 'LineID', type: 'int', notNull: true },
          ],
          primaryKey: ['OrderID', 'LineID'],
          rows: [],
        },
      ],
    } as never);
    try {
      const result = await connector.query(
        'SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE ORDER BY ORDINAL_POSITION'
      );
      expect(result.rows.filter((row) => row.TABLE_NAME === 'ORDER_LINES')).toEqual([
        { TABLE_NAME: 'ORDER_LINES', COLUMN_NAME: 'ORDERID', ORDINAL_POSITION: 1 },
        { TABLE_NAME: 'ORDER_LINES', COLUMN_NAME: 'LINEID', ORDINAL_POSITION: 2 },
      ]);
    } finally {
      await connector.close();
    }
  });
});
