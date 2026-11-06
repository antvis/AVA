/**
 * Unit and integration tests for the BigQuery remote engine. All tests run
 * against the built-in in-memory mock connector — no live GCP project or
 * network access is required. They cover schema discovery, read-only query
 * execution, row-limit handling, error handling, and resource disposal.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA, BIGQUERY_TABLE_SEED } from '../../src';
import { BigQueryEngine, MockQueryConnector, validateReadOnlyBigQuery, limitedBigQuerySql } from '../../src/remote/bigquery';
import { BigQueryQueryConnector } from '../../src/remote/bigquery/bigquery-connector';
import { BUILTIN_METRICS as BIGQUERY_METRICS, profileTables as bigQueryProfile } from '../../src/remote/bigquery/profile';
import { getLLMConfig } from '../test-utils';

import type { Schema } from '../../src/types';

const MOCK_SOURCE = {
  type: 'bigquery' as const,
  options: {
    projectId: 'demo-project',
    dataset: 'sales',
    adapter: 'mock' as const,
    tables: BIGQUERY_TABLE_SEED,
  },
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('validateReadOnlyBigQuery', () => {
  it.each([
    ['SELECT * FROM orders', true],
    ['WITH x AS (SELECT 1 AS a) SELECT * FROM x', true],
    ['select region, sum(units) from orders group by region', true],
    ['SELECT * FROM orders; -- trailing comment', true],
    ["SELECT * FROM orders WHERE product = 'select from' AND region = 'drop'", true],
    ['SELECT `orders`.`order_id` FROM orders', true],
  ])('accepts %s', (sql, ok) => {
    if (ok) expect(() => validateReadOnlyBigQuery(sql)).not.toThrow();
  });

  it('accepts a SELECT with an atomic UPDATE/INSERT-free fragment inside a string literal', () => {
    expect(() => validateReadOnlyBigQuery("SELECT * FROM orders WHERE note = 'INSERT INTO x'")).not.toThrow();
  });

  it.each([
    'DELETE FROM orders',
    'UPDATE orders SET region = 1',
    'INSERT INTO orders VALUES (1)',
    'DROP TABLE orders',
    'CREATE TABLE t (id int)',
    'EXPORT DATA OPTIONS(uri="") AS SELECT 1',
    'CALL my_dataset.my_procedure()',
    'SELECT 1; DROP TABLE orders',
    'SELECT * FROM (SELECT 1) x; DELETE FROM t',
    'TRUNCATE TABLE orders',
  ])('rejects %s', (sql) => {
    expect(() => validateReadOnlyBigQuery(sql)).toThrow();
  });
});

describe('limitedBigQuerySql', () => {
  it('wraps a SELECT in a derived table with LIMIT N', () => {
    expect(limitedBigQuerySql('SELECT region FROM orders', 3)).toBe(
      'SELECT * FROM (\nSELECT region FROM orders\n) AS __ava_query LIMIT 4'
    );
  });
});

describe('BigQueryEngine (mock adapter)', () => {
  it('rejects an unloaded engine and incompatible sources', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await expect(engine.schema()).rejects.toThrow('No data loaded');
      await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
    } finally {
      await engine.dispose();
    }

    const loaded = new BigQueryEngine(getLLMConfig());
    try {
      await expect(loaded.load({ type: 'csv-file', options: { path: 'unused' } })).rejects.toThrow(
        "only supports 'bigquery'"
      );
      await expect(loaded.schema()).rejects.toThrow('No data loaded');
    } finally {
      await loaded.dispose();
    }
  });

  it('discovers tables and columns through dataset INFORMATION_SCHEMA', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const schema = await engine.schema();
      const names = schema.models.map((m) => m.name);
      expect(names).toEqual(['customers', 'orders']);

      const orders = schema.models.find((m) => m.name === 'orders')!;
      expect(orders.columns).toEqual(
        expect.arrayContaining([{ name: 'order_id', type: 'INT64', notNull: true }])
      );
      expect(orders.primaryKey).toBe('order_id');
      expect(orders.tableReference).toEqual({ catalog: 'sales', table: 'orders' });
    } finally {
      await engine.dispose();
    }
  });

  it('preserves every column and its order in a composite primary key', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load({
        type: 'bigquery',
        options: {
          projectId: 'demo-project',
          dataset: 'sales',
          adapter: 'mock',
          tables: [
            {
              name: 'tenant_orders',
              columns: [
                { name: 'tenant_id', type: 'INT64', notNull: true },
                { name: 'order_id', type: 'INT64', notNull: true },
                { name: 'revenue', type: 'NUMERIC' },
              ],
              primaryKey: ['tenant_id', 'order_id'],
              rows: [{ tenant_id: 1, order_id: 10, revenue: 100 }],
            },
          ],
        },
      });

      const schema = await engine.schema();
      expect(schema.models[0].primaryKey).toEqual(['tenant_id', 'order_id']);
    } finally {
      await engine.dispose();
    }
  });

  it('executes a bounded read-only query through the mock connector', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const result = await engine.execute(
        'SELECT region, SUM(units) AS total_units FROM orders GROUP BY region'
      );
      expect(result.data).toEqual([
        { region: 'North', total_units: 12 },
        { region: 'South', total_units: 17 },
        { region: 'West', total_units: 11 },
      ]);
      expect(result.rowCount).toBe(3);
    } finally {
      await engine.dispose();
    }
  });

  it('caps rows to the configured limit and flags truncation', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
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
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      await expect(engine.execute('SELECT * FROM missing_table')).rejects.toThrow('not found');
    } finally {
      await engine.dispose();
    }
  });

  it('rejects write statements before execution', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      await expect(engine.execute('DELETE FROM orders')).rejects.toThrow('read-only');
      await expect(engine.execute('UPDATE orders SET region = 2')).rejects.toThrow('read-only');
    } finally {
      await engine.dispose();
    }
  });

  it('dispose releases the connector so further calls fail cleanly', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    await engine.load(MOCK_SOURCE);
    await engine.dispose();
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
  });

  it('integrates with AVA end-to-end', async () => {
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await ava.source(MOCK_SOURCE);
      expect(ava.engine!.language).toEqual({ name: 'Google BigQuery SQL dialect (GoogleSQL)', fence: 'sql' });

      const schema = await ava.schema();
      expect(schema.models.some((m) => m.name === 'orders')).toBe(true);

      const result = await ava.query('SELECT COUNT(*) AS n FROM orders');
      expect(result.data).toEqual([{ n: 6 }]);
    } finally {
      await ava.dispose();
    }
  });
});

describe('BigQueryEngine profile', () => {
  const schema: Schema = {
    models: [
      {
        name: 'orders',
        tableReference: { catalog: 'sales', table: 'orders' },
        columns: [
          { name: 'units', type: 'INT64', notNull: true },
          { name: 'region', type: 'STRING', notNull: false },
        ],
      },
    ],
  };

  it('profiles the seeded adapter through engine.profile()', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const result = await engine.profile(await engine.schema());
      const orders = result.models.find((model) => model.name === 'orders')!;
      const region = orders.columns.find((column) => column.name === 'region')!;
      const units = orders.columns.find((column) => column.name === 'units')!;

      expect(orders.metrics.row_count).toBe(6);
      expect(region.metrics).toMatchObject({ null_count: 0, distinct_count: 3 });
      expect(region.metrics.top_values).toEqual([
        { value: 'North', count: 2 },
        { value: 'South', count: 2 },
        { value: 'West', count: 2 },
      ]);
      expect(units.metrics.mean).toBeCloseTo(40 / 6);
      expect(units.metrics.min).toBe(2);
      expect(units.metrics.max).toBe(12);
    } finally {
      await engine.dispose();
    }
  });

  it('computes numeric metrics from a single aggregate query', async () => {
    const run = vi
      .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
      .mockResolvedValue([{ m0: '6', m1: '12.5' }]);
    const result = await bigQueryProfile(run, schema, { metrics: [{ id: 'row_count' }, { id: 'mean' }] });
    expect(run).toHaveBeenCalledTimes(1);
    expect(result.models[0].metrics.row_count).toBe(6);
    expect(result.models[0].columns[0].metrics.mean).toBe(12.5);
    const query = run.mock.calls[0][0];
    expect(query).toContain('AVG(CAST(`units` AS FLOAT64))');
    expect(query).not.toContain('CREATE');
  });

  it('propagates query failures', async () => {
    await expect(
      bigQueryProfile(
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
    await expect(bigQueryProfile(bad, schema, { metrics: [{ id: 'top_values' }] })).rejects.toThrow(
      'Invalid BigQuery top_values'
    );

    const run = vi.fn<any>().mockResolvedValue([{}]);
    await expect(bigQueryProfile(run, schema, { metrics: [{ id: 'missing' }] })).rejects.toThrow('Unknown metric');
    expect(run).not.toHaveBeenCalled();
  });

  it('exposes an identical metric id set across engines for parity', () => {
    const ids = BIGQUERY_METRICS.map((m) => m.id).sort();
    expect(ids).toEqual(['distinct_count', 'duplicate_count', 'max', 'max_length', 'mean', 'min', 'min_length', 'null_count', 'row_count', 'stddev', 'sum', 'top_values']);
  });
});

describe('BigQueryQueryConnector', () => {
  it.each([
    { configured: 25, expected: 25 },
    { configured: undefined, expected: 60000 },
  ])('enforces the $expected ms query deadline and requests job cancellation', async ({ configured, expected }) => {
    vi.useFakeTimers();
    const cancel = vi.fn(async () => undefined);
    const job = {
      getQueryResults: vi.fn(() => new Promise<never>(() => undefined)),
      cancel,
    };
    const createQueryJob = vi.fn(async () => [job, {}]);
    const connector = new BigQueryQueryConnector({
      projectId: 'demo-project',
      ...(configured === undefined ? {} : { timeoutMs: configured }),
    });
    Reflect.set(connector, 'client', { createQueryJob });

    const pending = connector.query('SELECT 1');
    const rejection = expect(pending).rejects.toThrow(
      `BigQuery query timed out after ${expected}ms; job cancellation was requested`
    );
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(expected);
    await rejection;

    expect(createQueryJob).toHaveBeenCalledTimes(1);
    expect(job.getQueryResults).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});

describe('MockQueryConnector', () => {
  it('is the production-independent default when adapter is mock', async () => {
    const connector = new MockQueryConnector({
      projectId: 'demo',
      dataset: 'demo',
      tables: BIGQUERY_TABLE_SEED,
    } as never);
    await connector.connect();
    const result = await connector.query('SELECT table_name FROM `demo`.INFORMATION_SCHEMA.TABLES');
    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    await connector.close();
    // After close, connect() re-seeds.
    await connector.connect();
    const again = await connector.query("SELECT region FROM orders WHERE region = 'North'");
    expect(again.rows.length).toBeGreaterThan(0);
    await connector.close();
  });
});