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
      expect(orders.tableReference).toEqual({ catalog: 'demo-project', schema: 'sales', table: 'orders' });
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

  it('applies the serialized-byte bound independently of the row bound', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    try {
      await engine.load(MOCK_SOURCE);
      const result = await engine.execute('SELECT * FROM orders', { maxRows: 6, maxResultBytes: 100 });
      expect(result.data.length).toBeLessThan(6);
      expect(result.truncated).toBe(true);
      expect(result.truncatedBy).toBe('maxResultBytes');
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

  it('profiles JSON columns with type-agnostic metrics only', async () => {
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
              name: 'events',
              columns: [
                { name: 'payload', type: 'JSON', notNull: false },
                { name: 'device', type: 'STRING', notNull: true },
              ],
              rows: [
                { payload: '{"a":1}', device: 'phone' },
                { payload: '{"b":2}', device: 'phone' },
                { payload: '{"c":3}', device: 'tablet' },
              ],
            },
          ],
        },
      });

      const result = await engine.profile(await engine.schema(), {
        metrics: [
          { id: 'row_count' },
          { id: 'null_count' },
          { id: 'duplicate_count' },
          { id: 'distinct_count' },
        ],
      });
      const events = result.models.find((model) => model.name === 'events')!;
      const payload = events.columns.find((column) => column.name === 'payload')!;
      expect(payload.properties.logicalType).toBe('unknown');
      expect(payload.metrics.duplicate_count).toBeUndefined();
      expect(payload.metrics.distinct_count).toBeUndefined();
      expect(payload.metrics.top_values).toBeUndefined();
      expect(payload.metrics.null_count).toBe(0);
      const device = events.columns.find((column) => column.name === 'device')!;
      expect(device.metrics.duplicate_count).toBe(1);
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

  it('generates duplicate-scale metrics only for columns whose type supports them', async () => {
    const jsonSchema: Schema = {
      models: [
        {
          name: 'orders',
          tableReference: { catalog: 'demo-project', schema: 'sales', table: 'orders' },
          columns: [
            { name: 'payload', type: 'JSON', notNull: false },
            { name: 'region', type: 'STRING', notNull: false },
          ],
        },
      ],
    };
    // m0: table row_count; m1/m2: region duplicate/distinct counts. The JSON
    // column has no pending metrics, so nothing is requested for it.
    const run = vi
      .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
      .mockResolvedValue([{ m0: '6', m1: '0', m2: '3' }]);
    const result = await bigQueryProfile(
      run,
      jsonSchema,
      { metrics: [{ id: 'row_count' }, { id: 'duplicate_count' }, { id: 'distinct_count' }] }
    );
    const payload = result.models[0].columns.find((column) => column.name === 'payload')!;
    expect(payload.metrics).toEqual({});
    const region = result.models[0].columns.find((column) => column.name === 'region')!;
    expect(region.metrics.duplicate_count).toBe(0);
    expect(region.metrics.distinct_count).toBe(3);
    expect(run).toHaveBeenCalledTimes(1);
    const query = run.mock.calls[0][0];
    expect(query).not.toContain('`payload`');
    expect(query).toContain('`region`');
  });
});

describe('BigQueryQueryConnector (SDK mocked)', () => {
  type Stub = {
    client: { createQueryJob: ReturnType<typeof vi.fn> };
    job: { getQueryResults: ReturnType<typeof vi.fn>; getMetadata: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> };
    createQueryJob: ReturnType<typeof vi.fn>;
  };

  /**
   * Stub the `@google-cloud/bigquery` client surface the connector uses:
   * `createQueryJob` (dry-run + regular) and `Job#getQueryResults`/`getMetadata`.
   */
  function stubClient(options: {
    dryRunBytes?: string;
    rows?: Record<string, unknown>[];
    responseSchema?: { fields?: Array<{ name: string; type: string }> };
    jobSchema?: { fields?: Array<{ name: string; type: string }> };
  }): Stub {
    const { dryRunBytes = '0', rows = [], responseSchema, jobSchema } = options;
    const job = {
      getQueryResults: vi.fn(async () => [
        rows,
        null,
        responseSchema === undefined ? {} : { schema: responseSchema },
      ]),
      getMetadata: vi.fn(async () => [{ statistics: { query: { schema: jobSchema ?? {} } } }]),
      cancel: vi.fn(async () => ({ status: { state: 'DONE' } })),
    };
    const createQueryJob = vi.fn(async (queryOptions: Record<string, unknown>) => {
      if ('dryRun' in queryOptions) {
        return [job, { statistics: { query: { totalBytesProcessed: dryRunBytes } } }];
      }
      return [job, {}];
    });
    return { client: { createQueryJob }, job, createQueryJob };
  }

  async function connect(
    options: Partial<Parameters<typeof BigQueryQueryConnector>[0]> & { projectId: string },
    stub: Stub
  ): Promise<BigQueryQueryConnector> {
    const connector = new BigQueryQueryConnector({ projectId: options.projectId, ...options });
    Reflect.set(connector, 'client', stub.client);
    return connector;
  }

  it('rejects writes before calling the SDK even when the connector is used directly', async () => {
    const stub = stubClient({});
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      await expect(connector.query('DELETE FROM orders')).rejects.toThrow('read-only');
      expect(stub.createQueryJob).not.toHaveBeenCalled();
    } finally {
      await connector.close();
    }
  });

  it('applies the row bound at the result-read interface, not the job config', async () => {
    const stub = stubClient({
      rows: [{ n: 1 }],
      responseSchema: { fields: [{ name: 'n', type: 'INT64' }] },
    });
    const connector = await connect(
      { projectId: 'demo-project', defaultRowLimit: 5, timeoutMs: 1000 },
      stub
    );
    try {
      const result = await connector.query('SELECT n FROM t');
      const jobOptions = stub.createQueryJob.mock.calls[0][0];
      expect(jobOptions.useLegacySql).toBe(false);
      expect('maxResults' in jobOptions).toBe(false);
      expect(stub.job.getQueryResults).toHaveBeenCalledWith(
        expect.objectContaining({ maxResults: 5, wrapIntegers: true, autoPaginate: false })
      );
      // Column names and types come from the driver schema, untouched.
      expect(result.columns).toEqual([{ name: 'n', type: 'INT64' }]);
    } finally {
      await connector.close();
    }
  });

  it('decodes values losslessly (BigInt/INT64 digits, temporal strings, numeric, bytes)', async () => {
    const stub = stubClient({
      rows: [
        {
          id: { value: '9007199254740993' },
          day: { value: '2023-01-02' },
          at: { value: '2023-01-02T10:00:00.000Z' },
          amount: { s: 1, e: 0, c: [9007199254740993, 25], toString() {
            return '9007199254740993.25';
          } },
          blob: Buffer.from('hello'),
        },
      ],
      responseSchema: {
        fields: [
          { name: 'id', type: 'INT64' },
          { name: 'day', type: 'DATE' },
          { name: 'at', type: 'TIMESTAMP' },
          { name: 'amount', type: 'NUMERIC' },
          { name: 'blob', type: 'BYTES' },
        ],
      },
    });
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      const result = await connector.query('SELECT id FROM t');
      expect(BigInt(result.rows[0]!.id as string)).toBe(9007199254740993n);
      expect(result.rows[0]).toEqual({
        id: '9007199254740993',
        day: '2023-01-02',
        at: '2023-01-02T10:00:00.000Z',
        amount: '9007199254740993.25',
        blob: 'aGVsbG8=',
      });
    } finally {
      await connector.close();
    }
  });

  it('exposes a schema for empty results from the job metadata', async () => {
    const stub = stubClient({ rows: [], jobSchema: { fields: [{ name: 'n', type: 'INT64' }] } });
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      const result = await connector.query('SELECT COUNT(*) AS n FROM t');
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([{ name: 'n', type: 'INT64' }]);
      expect(stub.job.getMetadata).toHaveBeenCalledTimes(1);
    } finally {
      await connector.close();
    }
  });

  it('rejects a dry-run estimate above the maximumBytesBilled budget before starting a job', async () => {
    const stub = stubClient({ dryRunBytes: '900719925474099300' });
    const connector = await connect({ projectId: 'demo-project', maxBytesBilled: 10000000 }, stub);
    try {
      await expect(connector.query('SELECT * FROM big_table')).rejects.toThrow(/maximumBytesBilled/);
      expect(stub.createQueryJob).toHaveBeenCalledTimes(1);
      expect(stub.createQueryJob.mock.calls[0][0]).toEqual(expect.objectContaining({ dryRun: true }));
      expect(stub.job.getQueryResults).not.toHaveBeenCalled();
    } finally {
      await connector.close();
    }
  });

  it('starts the real job with a server-side maximumBytesBilled when within budget', async () => {
    const stub = stubClient({ dryRunBytes: '42', rows: [{ n: 1 }], responseSchema: { fields: [{ name: 'n', type: 'INT64' }] } });
    const connector = await connect({ projectId: 'demo-project', maxBytesBilled: 10000000 }, stub);
    try {
      await connector.query('SELECT n FROM t');
      const jobOptions = stub.createQueryJob.mock.calls[1][0];
      expect('dryRun' in jobOptions).toBe(false);
      expect(jobOptions.maximumBytesBilled).toBe('10000000');
      expect(jobOptions.useLegacySql).toBe(false);
      expect(stub.job.getQueryResults).toHaveBeenCalledTimes(1);
    } finally {
      await connector.close();
    }
  });

  it('does not run a dry run when no budget is configured', async () => {
    const stub = stubClient({ rows: [{ n: 1 }], responseSchema: { fields: [{ name: 'n', type: 'INT64' }] } });
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      await connector.query('SELECT n FROM t');
      expect(stub.createQueryJob).toHaveBeenCalledTimes(1);
      expect(stub.createQueryJob.mock.calls[0][0]).toEqual(expect.objectContaining({ useLegacySql: false }));
      expect('dryRun' in stub.createQueryJob.mock.calls[0][0]).toBe(false);
    } finally {
      await connector.close();
    }
  });

  it('polls an incomplete job without enabling automatic result pagination', async () => {
    const stub = stubClient({});
    stub.job.getQueryResults
      .mockResolvedValueOnce([[], { location: 'US' }, { jobComplete: false }])
      .mockResolvedValueOnce([
        [{ n: { value: '1' } }],
        null,
        { jobComplete: true, schema: { fields: [{ name: 'n', type: 'INT64' }] } },
      ]);
    const connector = await connect({ projectId: 'demo-project', defaultRowLimit: 1 }, stub);
    try {
      const result = await connector.query('SELECT n FROM t');
      expect(result.rows).toEqual([{ n: '1' }]);
      expect(stub.job.getQueryResults).toHaveBeenCalledTimes(2);
      expect(stub.job.getQueryResults).toHaveBeenLastCalledWith(
        expect.objectContaining({ maxResults: 1, autoPaginate: false, wrapIntegers: true })
      );
    } finally {
      await connector.close();
    }
  });

  it('does not follow a result page token and pull the full result set', async () => {
    const stub = stubClient({});
    stub.job.getQueryResults.mockResolvedValue([
      [{ n: { value: '1' } }],
      { pageToken: 'more-rows' },
      { jobComplete: true, schema: { fields: [{ name: 'n', type: 'INT64' }] } },
    ]);
    const connector = await connect({ projectId: 'demo-project', defaultRowLimit: 1 }, stub);
    try {
      const result = await connector.query('SELECT n FROM t');
      expect(result.rows).toEqual([{ n: '1' }]);
      expect(stub.job.getQueryResults).toHaveBeenCalledTimes(1);
    } finally {
      await connector.close();
    }
  });

  it('cancels an in-flight job on close and rejects its pending query', async () => {
    const stub = stubClient({});
    let resolveResults: ((value: unknown) => void) | undefined;
    stub.job.getQueryResults = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveResults = resolve;
        })
    );
    const connector = await connect({ projectId: 'demo-project' }, stub);
    const pending = connector.query('SELECT n FROM t');
    const rejection = expect(pending).rejects.toThrow('connector was closed');
    await vi.waitFor(() => expect(stub.job.getQueryResults).toHaveBeenCalledTimes(1));

    await connector.close();
    expect(stub.job.cancel).toHaveBeenCalledTimes(1);
    resolveResults!([
      [{ n: { value: '1' } }],
      null,
      { schema: { fields: [{ name: 'n', type: 'INT64' }] } },
    ]);
    await rejection;
  });

  it.each([
    { configured: 25, expected: 25 },
    { configured: undefined, expected: 60000 },
  ])('enforces the $expected ms query deadline and requests job cancellation', async ({ configured, expected }) => {
    vi.useFakeTimers();
    const stub = stubClient({});
    stub.job.getQueryResults = vi.fn(() => new Promise<never>(() => undefined));
    const connector = await connect(
      { projectId: 'demo-project', ...(configured === undefined ? {} : { timeoutMs: configured }) },
      stub
    );

    const pending = connector.query('SELECT 1');
    const rejection = expect(pending).rejects.toThrow(
      `BigQuery query timed out after ${expected}ms; job cancellation was requested`
    );
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(expected);
    await rejection;

    expect(stub.job.getQueryResults).toHaveBeenCalledTimes(1);
    expect(stub.job.cancel).toHaveBeenCalledTimes(1);
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