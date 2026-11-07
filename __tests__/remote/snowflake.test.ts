/**
 * Unit and integration tests for the Snowflake remote engine. All tests run
 * against the built-in in-memory mock connector — no live Snowflake account or
 * network access is required. They cover schema discovery, read-only query
 * execution, row-limit handling, error handling, and resource disposal.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../src';
import { sourceConfig } from '../../src/cli/session/protocol';
import { limitedSnowflakeQuery, stripSqlComments } from '../../src/query/snowflake';
import { MockQueryConnector, SnowflakeEngine, validateReadOnlySnowflake } from '../../src/remote/snowflake';
import { SNOWFLAKE_TABLE_SEED } from '../../src/remote/snowflake/examples';
import {
  BUILTIN_METRICS as SNOWFLAKE_METRICS,
  profileTables as snowflakeProfile,
} from '../../src/remote/snowflake/profile';
import { getSnowflakeSchema } from '../../src/remote/snowflake/schema';
import { resolveSnowflakeConfig } from '../../src/remote/snowflake/snowflake-config';
import { getLLMConfig } from '../test-utils';

import type {
  DataSourceConfig,
  MockTableSeed,
  Schema,
  SnowflakeSDKSourceOptions,
  SnowflakeSourceOptions,
} from '../../src/types';

const MOCK_SOURCE = {
  type: 'snowflake' as const,
  options: {
    database: 'demo',
    schema: 'public',
    adapter: 'mock' as const,
    tables: SNOWFLAKE_TABLE_SEED,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('validateReadOnlySnowflake', () => {
  it.each([
    ['SELECT * FROM orders LIMIT 10', true],
    ['WITH x AS (SELECT 1 AS a) SELECT * FROM x', true],
    ['select region, sum(units) from orders group by region order by 2 desc', true],
    ['SELECT * FROM orders; -- trailing comment', true],
    ["SELECT * FROM orders WHERE product = 'select from' AND region = 'drop'", true],
  ])('accepts %s', (sql) => {
    expect(() => validateReadOnlySnowflake(sql)).not.toThrow();
  });

  it('accepts a SELECT with an atomic UPDATE/INSERT-free fragment inside a string literal', () => {
    expect(() => validateReadOnlySnowflake("SELECT * FROM orders WHERE note = 'INSERT INTO x'")).not.toThrow();
  });

  it.each([
    'DELETE FROM orders',
    'UPDATE orders SET region = 1',
    'INSERT INTO orders VALUES (1)',
    'DROP TABLE orders',
    'CREATE TABLE t (id int)',
    'CALL MY_PROC()',
    'SELECT * FROM RESULT_SCAN(last_query_id())',
    'SELECT 1; DROP TABLE orders',
    'SELECT * FROM (SELECT 1) x; DELETE FROM t',
  ])('rejects %s', (sql) => {
    expect(() => validateReadOnlySnowflake(sql)).toThrow();
  });
});

describe('SnowflakeEngine (mock adapter)', () => {
  it('rejects an unloaded engine and incompatible sources', async () => {
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await expect(engine.schema()).rejects.toThrow('No data loaded');
      await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
    } finally {
      await engine.dispose();
    }

    const loaded = new SnowflakeEngine(getLLMConfig());
    try {
      await expect(loaded.load({ type: 'csv-file', options: { path: 'unused' } })).rejects.toThrow(
        "only supports 'snowflake'"
      );
      await expect(loaded.schema()).rejects.toThrow('No data loaded');
    } finally {
      await loaded.dispose();
    }
  });

  it('discovers tables, columns, and primary keys through Snowflake catalog interfaces', async () => {
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const schema = await engine.schema();
      const names = schema.models.map((m) => m.name);
      expect(names).toEqual(['CUSTOMERS', 'ORDERS', 'PRODUCTS']);

      const orders = schema.models.find((m) => m.name === 'ORDERS')!;
      expect(orders.columns).toEqual(
        expect.arrayContaining([
          { name: 'ORDERID', type: 'NUMBER', notNull: true },
          { name: 'REGION', type: 'VARCHAR', notNull: false },
        ])
      );
      expect(orders.primaryKey).toBe('ORDERID');
      expect(orders.tableReference).toEqual({ catalog: 'demo', schema: 'PUBLIC', table: 'ORDERS' });
    } finally {
      await engine.dispose();
    }
  });

  it('executes a bounded read-only query through the mock connector', async () => {
    const engine = new SnowflakeEngine(getLLMConfig());
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
    const engine = new SnowflakeEngine(getLLMConfig());
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
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      await expect(engine.execute('SELECT * FROM missing_table')).rejects.toThrow('Invalid object name');
    } finally {
      await engine.dispose();
    }
  });

  it('rejects write statements before execution', async () => {
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      await expect(engine.execute('DELETE FROM orders')).rejects.toThrow('read-only');
      await expect(engine.execute('UPDATE orders SET region = 2')).rejects.toThrow('read-only');
    } finally {
      await engine.dispose();
    }
  });

  it('dispose releases the connector so further calls fail cleanly', async () => {
    const engine = new SnowflakeEngine(getLLMConfig());
    await engine.load(MOCK_SOURCE);
    await engine.dispose();
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
  });

  it('integrates with AVA end-to-end', async () => {
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'snowflake' } });
    try {
      await ava.source(MOCK_SOURCE);
      expect(ava.engine!.language).toEqual({ name: 'Snowflake SQL dialect', fence: 'sql' });

      const schema = await ava.schema();
      expect(schema.models.some((m) => m.name === 'ORDERS')).toBe(true);

      const result = await ava.query('SELECT COUNT(*) AS N FROM orders');
      expect(result.data).toEqual([{ N: 6 }]);
    } finally {
      await ava.dispose();
    }
  });
});

describe('SnowflakeEngine profile', () => {
  const schema: Schema = {
    models: [
      {
        name: 'orders',
        tableReference: { catalog: 'demo', schema: 'PUBLIC', table: 'orders' },
        columns: [
          { name: 'Units', type: 'NUMBER', notNull: true },
          { name: 'Region', type: 'VARCHAR', notNull: false },
        ],
      },
    ],
  };

  it('computes numeric metrics from a single aggregate query', async () => {
    const run = vi
      .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
      .mockResolvedValue([{ m0: '6', m1: '12.5' }]);
    const result = await snowflakeProfile(run, schema, { metrics: [{ id: 'row_count' }, { id: 'mean' }] });
    expect(run).toHaveBeenCalledTimes(1);
    expect(result.models[0].metrics.row_count).toBe(6);
    expect(result.models[0].columns[0].metrics.mean).toBe(12.5);
    const query = run.mock.calls[0][0];
    expect(query).toContain('AVG(CAST("Units" AS float))');
    expect(query).not.toContain('CREATE');
  });

  it('propagates query failures', async () => {
    await expect(
      snowflakeProfile(
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
    await expect(snowflakeProfile(bad, schema, { metrics: [{ id: 'top_values' }] })).rejects.toThrow(
      'Invalid Snowflake top_values'
    );

    const run = vi.fn<any>().mockResolvedValue([{}]);
    await expect(snowflakeProfile(run, schema, { metrics: [{ id: 'missing' }] })).rejects.toThrow('Unknown metric');
    expect(run).not.toHaveBeenCalled();
  });

  it('exposes an identical metric id set across engines for parity', () => {
    const ids = SNOWFLAKE_METRICS.map((m) => m.id).sort();
    expect(ids).toEqual([
      'distinct_count',
      'duplicate_count',
      'max',
      'max_length',
      'mean',
      'min',
      'min_length',
      'null_count',
      'row_count',
      'stddev',
      'sum',
      'top_values',
    ]);
  });
});

describe('MockQueryConnector', () => {
  it('seeds INFORMATION_SCHEMA and answers queries after reconnect', async () => {
    const connector = new MockQueryConnector({ adapter: 'mock', database: 'demo', tables: SNOWFLAKE_TABLE_SEED });
    await connector.connect();
    const result = await connector.query('SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES');
    expect(result.rows.length).toBeGreaterThanOrEqual(3);
    await connector.close();
    // After close, connect() re-seeds.
    await connector.connect();
    const again = await connector.query("SELECT Region FROM orders WHERE Region = 'North'");
    expect(again.rows.length).toBeGreaterThan(0);
    await connector.close();
  });

  it('rejects non-SELECT statements', async () => {
    const connector = new MockQueryConnector({ adapter: 'mock', database: 'demo', tables: SNOWFLAKE_TABLE_SEED });
    await connector.connect();
    await expect(connector.query('DELETE FROM orders')).rejects.toThrow('read-only SELECT');
    await connector.close();
  });

  it('enforces LIMIT on the underlying query', async () => {
    const connector = new MockQueryConnector({ adapter: 'mock', database: 'demo', tables: SNOWFLAKE_TABLE_SEED });
    await connector.connect();
    const result = await connector.query('SELECT * FROM orders LIMIT 2');
    expect(result.rows).toHaveLength(2);
    await connector.close();
  });
});

function compact(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('Snowflake schema discovery review regressions', () => {
  it('normalizes SDK uppercase catalog keys and maps ordered composite SHOW PRIMARY KEYS rows', async () => {
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockImplementation(async (sql) => {
      if (/FROM INFORMATION_SCHEMA\.TABLES/i.test(sql)) {
        return [{ TABLE_NAME: 'ORDERS' }, { TABLE_NAME: 'CUSTOMERS' }];
      }
      if (/FROM INFORMATION_SCHEMA\.COLUMNS/i.test(sql)) {
        return [
          { TABLE_NAME: 'ORDERS', NAME: 'ORDER_ID', TYPE: 'NUMBER', NULLABLE: 'NO' },
          { TABLE_NAME: 'ORDERS', NAME: 'CUSTOMER_ID', TYPE: 'NUMBER', NULLABLE: 'NO' },
          { TABLE_NAME: 'ORDERS', NAME: 'NOTE', TYPE: 'VARCHAR', NULLABLE: 'YES' },
          { TABLE_NAME: 'CUSTOMERS', NAME: 'CUSTOMER_ID', TYPE: 'NUMBER', NULLABLE: 'NO' },
        ];
      }
      if (/^SHOW PRIMARY KEYS IN SCHEMA/i.test(sql.trim())) {
        return [
          {
            DATABASE_NAME: 'ANALYTICS',
            SCHEMA_NAME: 'PUBLIC',
            TABLE_NAME: 'ORDERS',
            COLUMN_NAME: 'CUSTOMER_ID',
            KEY_SEQUENCE: '2',
          },
          {
            DATABASE_NAME: 'ANALYTICS',
            SCHEMA_NAME: 'PUBLIC',
            TABLE_NAME: 'CUSTOMERS',
            COLUMN_NAME: 'CUSTOMER_ID',
            KEY_SEQUENCE: 1,
          },
          {
            DATABASE_NAME: 'ANALYTICS',
            SCHEMA_NAME: 'PUBLIC',
            TABLE_NAME: 'ORDERS',
            COLUMN_NAME: 'ORDER_ID',
            KEY_SEQUENCE: 1,
          },
        ];
      }
      throw new Error(`Unexpected discovery query: ${compact(sql)}`);
    });

    const schema = await getSnowflakeSchema(run, 'analytics', 'public');

    expect(schema).toEqual({
      models: [
        {
          name: 'ORDERS',
          tableReference: { catalog: 'analytics', schema: 'PUBLIC', table: 'ORDERS' },
          columns: [
            { name: 'ORDER_ID', type: 'NUMBER', notNull: true },
            { name: 'CUSTOMER_ID', type: 'NUMBER', notNull: true },
            { name: 'NOTE', type: 'VARCHAR', notNull: false },
          ],
          primaryKey: ['ORDER_ID', 'CUSTOMER_ID'],
        },
        {
          name: 'CUSTOMERS',
          tableReference: { catalog: 'analytics', schema: 'PUBLIC', table: 'CUSTOMERS' },
          columns: [{ name: 'CUSTOMER_ID', type: 'NUMBER', notNull: true }],
          primaryKey: 'CUSTOMER_ID',
        },
      ],
      relationships: [],
    });

    const statements = run.mock.calls.map(([sql]) => compact(sql));
    expect(statements).toHaveLength(3);
    expect(statements).toContain('SHOW PRIMARY KEYS IN SCHEMA "ANALYTICS"."PUBLIC"');
    expect(statements.every((sql) => !sql.includes('KEY_COLUMN_USAGE'))).toBe(true);
  });

  it('quotes each part of the fully qualified schema and escapes embedded quotes', async () => {
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockImplementation(async (sql) => {
      if (/FROM INFORMATION_SCHEMA\.TABLES/i.test(sql)) return [{ TABLE_NAME: 'EVENTS' }];
      if (/FROM INFORMATION_SCHEMA\.COLUMNS/i.test(sql)) {
        return [{ TABLE_NAME: 'EVENTS', NAME: 'ID', TYPE: 'NUMBER', NULLABLE: 'NO' }];
      }
      if (/^SHOW PRIMARY KEYS IN SCHEMA/i.test(sql.trim())) return [];
      throw new Error(`Unexpected discovery query: ${compact(sql)}`);
    });

    await getSnowflakeSchema(run, 'analytics"warehouse', 'sales"daily');

    const show = run.mock.calls.map(([sql]) => compact(sql)).find((sql) => sql.startsWith('SHOW PRIMARY KEYS'));
    expect(show).toBe('SHOW PRIMARY KEYS IN SCHEMA "ANALYTICS""WAREHOUSE"."SALES""DAILY"');
  });

  it('discovers columns and primary keys through the mock SHOW implementation', async () => {
    const connector = new MockQueryConnector({
      account: 'xy12345.us-east-1',
      username: 'reader',
      database: 'demo',
      schema: 'public',
      adapter: 'mock',
      tables: SNOWFLAKE_TABLE_SEED,
    });

    await connector.connect();
    try {
      const schema = await getSnowflakeSchema(async (sql) => (await connector.query(sql)).rows, 'demo', 'public');
      const orders = schema.models.find((model) => model.name === 'ORDERS');

      expect(schema.models.map((model) => model.name)).toEqual(['CUSTOMERS', 'ORDERS', 'PRODUCTS']);
      expect(orders).toMatchObject({
        tableReference: { catalog: 'demo', schema: 'PUBLIC', table: 'ORDERS' },
        primaryKey: 'ORDERID',
      });
      expect(orders?.columns).toEqual(
        expect.arrayContaining([
          { name: 'ORDERID', type: 'NUMBER', notNull: true },
          { name: 'REGION', type: 'VARCHAR', notNull: false },
        ])
      );
    } finally {
      await connector.close();
    }
  });
});

const JSON_SPECIAL_VALUE = 'quote " backslash \\ newline \n tab \t control \u0001';

const topValueSchema: Schema = {
  models: [
    {
      name: 'REVIEWS',
      columns: [{ name: 'LABEL', type: 'VARCHAR', notNull: false }],
    },
  ],
};

describe('Snowflake top_values JSON serialization', () => {
  it('uses Snowflake JSON constructors and preserves serialized values', async () => {
    const entries = [
      { value: JSON_SPECIAL_VALUE, count: 5 },
      { value: 'plain', count: 3 },
    ];
    const run = vi
      .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
      .mockResolvedValue([{ m0: JSON.stringify(entries) }]);

    const result = await snowflakeProfile(run, topValueSchema, { metrics: [{ id: 'top_values' }] });

    expect(result.models[0].columns[0].metrics.top_values).toEqual(entries);
    const sql = run.mock.calls[0][0];
    expect(sql).toContain("OBJECT_CONSTRUCT('value', v, 'count', n)");
    expect(sql).toContain('ARRAY_AGG(');
    expect(sql).toContain('TO_JSON(');
    expect(sql).not.toContain('LISTAGG(');
    expect(sql).not.toContain('REPLACE(');
  });
});

describe('SnowflakeEngine default profiling', () => {
  it('runs generated profile expressions through the real engine and seeded mock connector', async () => {
    const query = vi.spyOn(MockQueryConnector.prototype, 'query');
    const engine = new SnowflakeEngine(getLLMConfig());

    try {
      await engine.load({
        type: 'snowflake',
        options: {
          account: 'xy12345.us-east-1',
          username: 'reader',
          password: 'secret',
          database: 'demo',
          schema: 'PUBLIC',
          adapter: 'mock',
          tables: [
            {
              name: 'PROFILE_REVIEW',
              columns: [
                { name: 'ID', type: 'NUMBER', notNull: false },
                { name: 'LABEL', type: 'VARCHAR', notNull: false },
              ],
              rows: [
                { ID: 1, LABEL: JSON_SPECIAL_VALUE },
                { ID: 2, LABEL: JSON_SPECIAL_VALUE },
                { ID: 2, LABEL: 'plain' },
                { ID: 3, LABEL: JSON_SPECIAL_VALUE },
                { ID: 4, LABEL: 'plain' },
                { ID: null, LABEL: JSON_SPECIAL_VALUE },
                { ID: 5, LABEL: 'plain' },
                { ID: 6, LABEL: JSON_SPECIAL_VALUE },
              ],
            },
          ],
        },
      });

      const result = await engine.profile(await engine.schema());
      const profileCall = query.mock.calls.find(
        ([sql]) => sql.includes(' AS "m0"') && sql.includes('FROM "PROFILE_REVIEW"')
      );
      if (!profileCall) throw new Error('Default profiler did not query PROFILE_REVIEW');
      const [sql] = profileCall;

      expect(sql).toContain('COUNT(*) - COUNT("ID")');
      expect(sql).toContain('COUNT(DISTINCT "ID")');
      expect(sql).toContain('CAST("ID" AS float)');
      expect(sql).toContain('CASE WHEN COUNT(DISTINCT CAST("LABEL" AS varchar(4000)))');
      expect(sql).toContain("OBJECT_CONSTRUCT('value', v, 'count', n)");

      const model = result.models[0];
      expect(model.metrics.row_count).toBe(8);
      const id = model.columns.find((column) => column.name === 'ID')!;
      expect(id.metrics.null_count).toBe(1);
      expect(id.metrics.distinct_count).toBe(6);
      expect(id.metrics.min).toBe(1);
      expect(id.metrics.max).toBe(6);
      expect(id.metrics.mean).toBeCloseTo(23 / 7);

      const label = model.columns.find((column) => column.name === 'LABEL')!;
      expect(label.metrics.top_values).toEqual([
        { value: JSON_SPECIAL_VALUE, count: 5 },
        { value: 'plain', count: 3 },
      ]);
    } finally {
      await engine.dispose();
    }
  });
});

const REAL_OPTIONS = {
  account: 'xy12345.us-east-1',
  username: 'reader',
  database: 'analytics',
} satisfies SnowflakeSDKSourceOptions;

const DOCUMENTED_MOCK_SOURCE = {
  type: 'snowflake',
  options: {
    adapter: 'mock',
    database: 'demo',
    tables: [
      {
        name: 'orders',
        columns: [{ name: 'id', type: 'NUMBER' }],
        rows: [{ id: 1 }],
      },
    ],
  },
} satisfies DataSourceConfig;

describe('Snowflake source option contracts', () => {
  it('accepts the documented credential-free mock source in TypeScript and the CLI schema', () => {
    expect(sourceConfig.parse(DOCUMENTED_MOCK_SOURCE)).toEqual(DOCUMENTED_MOCK_SOURCE);
  });

  it('still requires account, username, and database for the production adapter', () => {
    const invalidOptions = [
      { database: 'analytics' },
      { adapter: 'snowflake', username: 'reader', database: 'analytics' },
      { adapter: 'snowflake', account: 'xy12345.us-east-1', database: 'analytics' },
      { adapter: 'snowflake', account: 'xy12345.us-east-1', username: 'reader' },
    ];

    for (const options of invalidOptions) {
      expect(sourceConfig.safeParse({ type: 'snowflake', options }).success).toBe(false);
    }
    expect(sourceConfig.safeParse({ type: 'snowflake', options: { adapter: 'mock' } }).success).toBe(false);
  });

  it('preserves an OAuth token through the CLI schema', () => {
    const source = {
      type: 'snowflake',
      options: { ...REAL_OPTIONS, authenticator: 'OAUTH', token: 'oauth-access-token' },
    };
    expect(sourceConfig.parse(source)).toEqual(source);
  });
});

describe('Snowflake driver config', () => {
  it('uses JWT auth and omits password whenever a private key is supplied', () => {
    const config = resolveSnowflakeConfig({
      ...REAL_OPTIONS,
      privateKey: '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
      password: 'must-not-be-forwarded',
      authenticator: 'OAUTH',
    });

    expect(config.authenticator).toBe('SNOWFLAKE_JWT');
    expect(config.privateKey).toContain('BEGIN PRIVATE KEY');
    expect(config).not.toHaveProperty('password');
  });

  it('forwards the OAuth token to snowflake-sdk', () => {
    const config = resolveSnowflakeConfig({ ...REAL_OPTIONS, authenticator: 'OAUTH', token: 'oauth-access-token' });
    expect(config).toMatchObject({ authenticator: 'OAUTH', token: 'oauth-access-token' });
  });
});

async function importConnectorWith(requireModule: (id: string) => unknown) {
  vi.resetModules();
  vi.doMock('node:module', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:module')>();
    return { ...actual, createRequire: vi.fn(() => requireModule) };
  });
  return import('../../src/remote/snowflake/snowflake');
}

describe('Snowflake SDK lazy loader', () => {
  afterEach(() => {
    vi.doUnmock('node:module');
    vi.resetModules();
  });

  it('loads the SDK through createRequire and passes the resolved driver config', async () => {
    const connection = {
      connect: vi.fn((callback: (error?: unknown) => void) => callback()),
      execute: vi.fn(),
      destroy: vi.fn((callback: (error?: unknown) => void) => callback()),
      isValidAsync: vi.fn(async () => true),
    };
    const createConnection = vi.fn(() => connection);
    const requireModule = vi.fn((id: string) => {
      if (id !== 'snowflake-sdk') throw new Error(`Unexpected module: ${id}`);
      return { createConnection };
    });
    const { SnowflakeQueryConnector } = await importConnectorWith(requireModule);
    const connector = new SnowflakeQueryConnector({ ...REAL_OPTIONS, token: 'oauth-access-token' });

    await connector.connect();

    expect(requireModule).toHaveBeenCalledTimes(1);
    expect(requireModule).toHaveBeenCalledWith('snowflake-sdk');
    expect(createConnection).toHaveBeenCalledWith(expect.objectContaining({ token: 'oauth-access-token' }));
    await connector.close();
  });

  it('adds installation guidance only when snowflake-sdk itself is absent', async () => {
    const requireModule = vi.fn(() => {
      throw Object.assign(new Error("Cannot find module 'snowflake-sdk'"), { code: 'MODULE_NOT_FOUND' });
    });
    const { SnowflakeQueryConnector } = await importConnectorWith(requireModule);

    await expect(new SnowflakeQueryConnector(REAL_OPTIONS).connect()).rejects.toThrow(
      'Install it (npm i snowflake-sdk)'
    );
  });

  it('does not disguise a missing dependency inside the SDK as a missing SDK', async () => {
    const driverError = Object.assign(new Error("Cannot find module 'driver-internal-dependency'"), {
      code: 'MODULE_NOT_FOUND',
    });
    const requireModule = vi.fn(() => {
      throw driverError;
    });
    const { SnowflakeQueryConnector } = await importConnectorWith(requireModule);

    await expect(new SnowflakeQueryConnector(REAL_OPTIONS).connect()).rejects.toBe(driverError);
  });
});

describe('Snowflake query review regressions', () => {
  const MOCK_SOURCE = {
    type: 'snowflake' as const,
    options: {
      account: 'xy12345.us-east-1',
      username: 'reader',
      password: 'secret',
      database: 'demo',
      schema: 'public',
      adapter: 'mock' as const,
      tables: SNOWFLAKE_TABLE_SEED,
    },
  };

  describe('Snowflake read-only lexical validation regressions', () => {
    it.each([
      'SELECT "INFO" FROM orders',
      'SELECT $$drop$$ AS note',
      "SELECT GET(payload, 'field') FROM events",
      "SELECT (GET(payload, 'field')) FROM events",
      'SELECT * FROM orders LIMIT 10',
      'WITH x AS (SELECT 1 AS a) SELECT * FROM x',
      'select region, sum(units) from orders group by region order by 2 desc',
      "SELECT * FROM orders WHERE product = 'select from' AND region = 'drop'",
      "SELECT 'it''s; DROP TABLE orders' AS note",
      'SELECT $$; DROP TABLE orders; -- still a literal$$ AS note',
      'SELECT 1 /* DROP TABLE orders; DELETE FROM orders */',
      'SELECT RESULT_SCAN FROM orders',
      'WITH "INFO" AS (SELECT $$DELETE$$ AS note) SELECT * FROM "INFO"',
      'SELECT * FROM orders; /* one trailing empty statement */ ; -- trailing comment',
    ])('accepts valid read-only syntax without matching text inside literals or identifiers: %s', (sql) => {
      expect(() => validateReadOnlySnowflake(sql)).not.toThrow();
    });

    it('strips comments and both string literal forms without stripping quoted identifiers', () => {
      const stripped = stripSqlComments(
        "SELECT \"INFO\", $$drop -- ;$$ AS dollar_note, 'it''s /* hidden */' AS note /* DROP */ FROM orders"
      );
      expect(stripped).toContain('"INFO"');
      expect(stripped).toContain('FROM orders');
      expect(stripped).not.toContain('drop');
      expect(stripped).not.toContain('hidden');
      expect(stripped).not.toContain('DROP');
    });

    it.each([
      'SELECT * FROM RESULT_SCAN(last_query_id())',
      'SELECT * FROM TABLE(RESULT_SCAN(last_query_id()))',
      "SELECT CREATE_STATEMENT('DROP TABLE orders')",
      "SELECT * FROM orders INTO OUTFILE 's3://bucket/out'",
      'SELECT * FROM orders FOR UPDATE',
      'SELECT * FROM (DELETE FROM orders)',
      'WITH x AS (DROP TABLE orders) SELECT 1',
      'WITH x AS (SELECT 1) DELETE FROM orders',
      "SELECT * FROM (WITH x AS (SELECT 1) UPDATE orders SET region = 'x')",
      'SELECT 1; -- a comment does not hide the next statement\nDROP TABLE orders',
    ])('rejects actual unsupported statements, clauses, and function calls: %s', (sql) => {
      expect(() => validateReadOnlySnowflake(sql)).toThrow();
    });

    it.each([
      'SELECT ORDERS_SEQ.NEXTVAL',
      'select orders_seq.nextval',
      'SELECT "ORDERS_SEQ"."NEXTVAL"',
      'SELECT "orders_seq"."nextval"',
      'SELECT db.schema.ORDERS_SEQ.NeXtVaL AS id',
      'SELECT * FROM orders WHERE id = ORDERS_SEQ.NEXTVAL',
      'WITH x AS (SELECT ORDERS_SEQ.NEXTVAL AS id) SELECT * FROM x',
    ])('rejects sequence advancement by dotted identifier structure: %s', (sql) => {
      expect(() => validateReadOnlySnowflake(sql)).toThrow('must not advance a sequence with NEXTVAL');
    });

    it.each([
      'SELECT NEXTVAL, "NEXTVAL" FROM orders',
      'SELECT * FROM "ORDERS_SEQ.NEXTVAL"',
      "SELECT 'ORDERS_SEQ.NEXTVAL' AS note",
      'SELECT $$ORDERS_SEQ.NEXTVAL$$ AS note',
    ])('does not mistake non-sequence NEXTVAL text for sequence advancement: %s', (sql) => {
      expect(() => validateReadOnlySnowflake(sql)).not.toThrow();
    });
  });

  describe('Snowflake terminal semicolon normalization', () => {
    it.each([
      'SELECT * FROM orders; -- trailing comment',
      'SELECT * FROM orders; /* trailing ; comment */',
      'SELECT * FROM orders; // trailing comment',
      'SELECT * FROM orders -- trailing comment without a semicolon',
    ])('normalizes the statement instead of wrapping its terminator or comment: %s', (sql) => {
      expect(validateReadOnlySnowflake(sql)).toBe('SELECT * FROM orders');
    });

    it('does not treat semicolons or comment markers inside literals as terminators', () => {
      expect(validateReadOnlySnowflake("SELECT '; -- /*' AS note; // trailing")).toBe("SELECT '; -- /*' AS note");
      expect(validateReadOnlySnowflake('SELECT $$; -- /*$$ AS note; /* trailing */')).toBe(
        'SELECT $$; -- /*$$ AS note'
      );
    });

    it('normalizes direct LIMIT wrapping with line and block comments', () => {
      expect(limitedSnowflakeQuery('SELECT * FROM orders; -- trailing comment', 10)).toBe(
        'SELECT * FROM (\nSELECT * FROM orders\n) AS __ava_query LIMIT 11'
      );
      expect(limitedSnowflakeQuery('SELECT * FROM orders /* trailing */ ; /* comment */', 3)).toBe(
        'SELECT * FROM (\nSELECT * FROM orders\n) AS __ava_query LIMIT 4'
      );
    });

    it('validates and executes terminated queries with trailing comments through the existing mock engine', async () => {
      const engine = new SnowflakeEngine(getLLMConfig());
      await engine.load(MOCK_SOURCE);
      try {
        const lineComment = await engine.execute('SELECT * FROM orders; -- trailing comment');
        expect(lineComment.data).toHaveLength(6);
        expect(lineComment.rowCount).toBe(6);

        const blockComment = await engine.execute('SELECT * FROM orders; /* trailing ; -- */', { maxRows: 2 });
        expect(blockComment.data).toHaveLength(2);
        expect(blockComment.truncated).toBe(true);
        expect(blockComment.truncatedBy).toBe('maxRows');
      } finally {
        await engine.dispose();
      }
    });
  });
});

describe('Snowflake mock review regressions', () => {
  const connectors: MockQueryConnector[] = [];

  function connector(tables: MockTableSeed[], schema = 'PUBLIC'): MockQueryConnector {
    const options: SnowflakeSourceOptions = {
      account: 'test',
      username: 'test',
      database: 'DEMO',
      schema,
      adapter: 'mock',
      tables,
    };
    const instance = new MockQueryConnector(options);
    connectors.push(instance);
    return instance;
  }

  afterEach(async () => {
    await Promise.all(connectors.splice(0).map((instance) => instance.close()));
  });

  const items = (schema: string, id: string): MockTableSeed => ({
    name: 'ITEMS',
    schema,
    columns: [{ name: 'ID', type: 'VARCHAR', notNull: true }],
    rows: [{ ID: id }],
  });

  const events: MockTableSeed[] = [
    {
      name: 'EVENTS',
      columns: [
        { name: 'ID', type: 'NUMBER', notNull: true },
        { name: 'REGION', type: 'VARCHAR', notNull: true },
        { name: 'AMOUNT', type: 'NUMBER', notNull: true },
        { name: 'A', type: 'NUMBER', notNull: true },
        { name: 'B', type: 'NUMBER', notNull: true },
        { name: 'C', type: 'NUMBER', notNull: true },
        { name: 'OPTIONAL_VALUE', type: 'NUMBER' },
        { name: 'LABEL', type: 'VARCHAR', notNull: true },
      ],
      rows: [
        { ID: 1, REGION: 'North', AMOUNT: 5, A: 1, B: 0, C: 0, OPTIONAL_VALUE: null, LABEL: 'x' },
        { ID: 2, REGION: 'North', AMOUNT: 10, A: 0, B: 1, C: 0, OPTIONAL_VALUE: 5, LABEL: 'x' },
        { ID: 3, REGION: 'South', AMOUNT: 4, A: 0, B: 1, C: 1, OPTIONAL_VALUE: 15, LABEL: 'y' },
        { ID: 4, REGION: 'South', AMOUNT: 6, A: 0, B: 0, C: 0, OPTIONAL_VALUE: null, LABEL: 'y' },
      ],
    },
  ];

  describe('MockQueryConnector review regressions', () => {
    it('rejects stage references without getting stuck in the tokenizer', async () => {
      const db = connector(events);
      await expect(db.query('SELECT * FROM @stage')).rejects.toThrow(/stage references/i);
    });

    it('preserves seed schemas in the catalog and resolves qualified/current schemas', async () => {
      const db = connector([items('PUBLIC', 'public'), items('AUDIT', 'audit')]);
      const catalog = await db.query(
        "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ITEMS' ORDER BY TABLE_SCHEMA"
      );
      expect(catalog.rows).toEqual([
        { TABLE_SCHEMA: 'AUDIT', TABLE_NAME: 'ITEMS' },
        { TABLE_SCHEMA: 'PUBLIC', TABLE_NAME: 'ITEMS' },
      ]);
      expect((await db.query('SELECT ID FROM ITEMS')).rows).toEqual([{ ID: 'public' }]);
      expect((await db.query('SELECT ID FROM AUDIT.ITEMS')).rows).toEqual([{ ID: 'audit' }]);
      expect((await db.query('SELECT ID FROM "DEMO"."AUDIT"."ITEMS"')).rows).toEqual([{ ID: 'audit' }]);
      await expect(db.query('SELECT ID FROM MISSING.ITEMS')).rejects.toThrow('Invalid object name');

      const audit = connector([items('PUBLIC', 'public'), items('AUDIT', 'audit')], 'AUDIT');
      expect((await audit.query('SELECT ID FROM ITEMS')).rows).toEqual([{ ID: 'audit' }]);
    });

    it('deduplicates SELECT DISTINCT for ordinary and catalog queries', async () => {
      const db = connector(events);
      expect((await db.query('SELECT DISTINCT LABEL FROM EVENTS ORDER BY LABEL')).rows).toEqual([
        { LABEL: 'x' },
        { LABEL: 'y' },
      ]);
      expect(
        (await db.query("SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'PUBLIC'")).rows
      ).toEqual([{ TABLE_NAME: 'EVENTS' }]);
    });

    it('evaluates HAVING after aggregation', async () => {
      const db = connector(events);
      const result = await db.query(
        'SELECT REGION, SUM(AMOUNT) AS TOTAL FROM EVENTS GROUP BY REGION HAVING SUM(AMOUNT) > 10 ORDER BY REGION'
      );
      expect(result.rows).toEqual([{ REGION: 'North', TOTAL: 15 }]);
    });

    it('applies AND before OR in WHERE clauses', async () => {
      const db = connector(events);
      const result = await db.query('SELECT ID FROM EVENTS WHERE A = 1 OR B = 1 AND C = 1 ORDER BY ID');
      expect(result.rows).toEqual([{ ID: 1 }, { ID: 3 }]);
    });

    it('filters out UNKNOWN comparisons involving NULL', async () => {
      const db = connector(events);
      expect((await db.query('SELECT ID FROM EVENTS WHERE OPTIONAL_VALUE < 10 ORDER BY ID')).rows).toEqual([{ ID: 2 }]);
      expect((await db.query('SELECT ID FROM EVENTS WHERE OPTIONAL_VALUE <> 10 ORDER BY ID')).rows).toEqual([
        { ID: 2 },
        { ID: 3 },
      ]);
      expect((await db.query('SELECT ID FROM EVENTS WHERE OPTIONAL_VALUE = NULL')).rows).toEqual([]);
    });

    it('preserves ordered composite keys in SHOW PRIMARY KEYS and the catalog', async () => {
      const db = connector([
        {
          name: 'COMPOSITE',
          schema: 'APP',
          columns: [
            { name: 'ID', type: 'NUMBER', notNull: true },
            { name: 'TENANT', type: 'NUMBER', notNull: true },
          ],
          primaryKey: ['TENANT', 'ID'],
        },
      ]);
      const shown = await db.query('SHOW PRIMARY KEYS IN SCHEMA "DEMO"."APP"');
      expect(shown.rows).toEqual([
        { database_name: 'DEMO', schema_name: 'APP', table_name: 'COMPOSITE', column_name: 'TENANT', key_sequence: 1 },
        { database_name: 'DEMO', schema_name: 'APP', table_name: 'COMPOSITE', column_name: 'ID', key_sequence: 2 },
      ]);
      const catalog = await db.query(
        "SELECT COLUMN_NAME, ORDINAL_POSITION FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'APP' ORDER BY ORDINAL_POSITION"
      );
      expect(catalog.rows).toEqual([
        { COLUMN_NAME: 'TENANT', ORDINAL_POSITION: 1 },
        { COLUMN_NAME: 'ID', ORDINAL_POSITION: 2 },
      ]);
    });

    it('returns no rows for LIMIT 0', async () => {
      const db = connector(events);
      expect((await db.query('SELECT * FROM EVENTS LIMIT 0')).rows).toEqual([]);
    });

    it('runs the default profiler against the actual engine and preserves special characters', async () => {
      const special = 'quote" backslash\\ newline\n snow 雪';
      const engine = new SnowflakeEngine({ model: 'unused' });
      try {
        await engine.load({
          type: 'snowflake',
          options: {
            account: 'test',
            username: 'test',
            database: 'DEMO',
            adapter: 'mock',
            tables: [
              {
                name: 'PROFILE_REVIEW',
                columns: [
                  { name: 'ID', type: 'NUMBER', notNull: true },
                  { name: 'VALUE', type: 'NUMBER' },
                  { name: 'LABEL', type: 'VARCHAR' },
                ],
                primaryKey: 'ID',
                rows: [
                  { ID: 1, VALUE: 10, LABEL: special },
                  { ID: 2, VALUE: 20, LABEL: special },
                  { ID: 3, VALUE: null, LABEL: special },
                  { ID: 4, VALUE: 40, LABEL: null },
                  { ID: 5, VALUE: 50, LABEL: 'plain' },
                  { ID: 6, VALUE: 60, LABEL: 'plain' },
                  { ID: 7, VALUE: 70, LABEL: special },
                  { ID: 8, VALUE: 80, LABEL: 'plain' },
                ],
              },
            ],
          },
        });
        const schema = await engine.schema();
        expect(schema.models[0].primaryKey).toBe('ID');
        const profile = await engine.profile(schema);
        expect(profile.models[0].metrics.row_count).toBe(8);
        const [id, value, label] = profile.models[0].columns;
        expect(id.metrics.null_count).toBe(0);
        expect(id.metrics.distinct_count).toBe(8);
        expect(value.metrics.null_count).toBe(1);
        expect(value.metrics.distinct_count).toBe(7);
        expect(value.metrics.mean).toBeCloseTo(330 / 7);
        expect(label.metrics.null_count).toBe(1);
        expect(label.metrics.distinct_count).toBe(2);
        expect(label.metrics.top_values).toEqual([
          { value: special, count: 4 },
          { value: 'plain', count: 3 },
        ]);
      } finally {
        await engine.dispose();
      }
    });
  });
});
