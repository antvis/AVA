/**
 * Unit and integration tests for the BigQuery remote engine. They use the
 * built-in in-memory connector plus stubbed SDK responses; no live GCP project,
 * authentication, or network access is required. Coverage includes public
 * schema propagation, manual pagination, output budgets, errors, and disposal.
 */
import { BigQuery } from '@google-cloud/bigquery';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA, BIGQUERY_TABLE_SEED } from '../../src';
import { BigQueryEngine, MockQueryConnector, validateReadOnlyBigQuery } from '../../src/remote/bigquery';
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

type Field = { name: string; type: string };

function resultPage(
  rows: Record<string, unknown>[],
  fields: Field[],
  pageToken?: string,
  totalRows = rows.length
) {
  return [
    rows,
    pageToken ? { pageToken } : null,
    {
      jobComplete: true,
      schema: { fields },
      totalRows: String(totalRows),
      ...(pageToken ? { pageToken } : {}),
    },
  ];
}

function jobWithPages(pages: unknown[]) {
  const getQueryResults = vi.fn();
  for (const page of pages) getQueryResults.mockResolvedValueOnce(page);
  return {
    getQueryResults,
    getMetadata: vi.fn(async () => [{ statistics: { query: {} } }]),
    cancel: vi.fn(async () => ({ status: { state: 'DONE' } })),
  };
}

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
      expect(ava.engine!.dialect.id).toBe('bigquery-sql');
      expect(ava.engine!.dialect.rules).toContain('ORDER BY at the outermost level');

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

  /** Stub the SDK request/response surface, including manual result pages. */
  function stubClient(options: {
    dryRunBytes?: string;
    rows?: Record<string, unknown>[];
    responseSchema?: { fields?: Field[] };
    pages?: unknown[];
  }): Stub {
    const { dryRunBytes = '0', rows = [], responseSchema, pages } = options;
    const defaultPage = [
      rows,
      null,
      { jobComplete: true, totalRows: String(rows.length), ...(responseSchema ? { schema: responseSchema } : {}) },
    ];
    const job = jobWithPages(pages ?? [defaultPage]);
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

  it('exposes empty-result columns from the successful result response without reading job metadata', async () => {
    const stub = stubClient({ rows: [], responseSchema: { fields: [{ name: 'n', type: 'INT64' }] } });
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      const result = await connector.query('SELECT n FROM t WHERE FALSE');
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([{ name: 'n', type: 'INT64' }]);
      expect(stub.job.getMetadata).not.toHaveBeenCalled();
    } finally {
      await connector.close();
    }
  });

  it('fails explicitly when a successful result response has no schema', async () => {
    const stub = stubClient({ rows: [{ n: { value: '1' } }] });
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      await expect(connector.query('SELECT n FROM t')).rejects.toThrow('jobs.getQueryResults');
      expect(stub.job.getMetadata).not.toHaveBeenCalled();
    } finally {
      await connector.close();
    }
  });

  it('does not fall back to ordinary job metadata for an empty result without a result schema', async () => {
    const stub = stubClient({ rows: [] });
    stub.job.getMetadata.mockResolvedValue([
      { statistics: { query: { schema: { fields: [{ name: 'n', type: 'INT64' }] } } } },
    ]);
    const connector = await connect({ projectId: 'demo-project' }, stub);
    try {
      await expect(connector.query('SELECT n FROM t WHERE FALSE')).rejects.toThrow('jobs.getQueryResults');
      expect(stub.job.getMetadata).not.toHaveBeenCalled();
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
    const stub = stubClient({
      pages: [
        [[], { location: 'US' }, { jobComplete: false }],
        resultPage([{ n: { value: '1' } }], [{ name: 'n', type: 'INT64' }]),
      ],
    });
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

  it('exhausts result pages in order when no output budget is supplied', async () => {
    const fields = [{ name: 'n', type: 'INT64' }];
    const stub = stubClient({
      pages: [
        resultPage([{ n: { value: '1' } }], fields, 'page-2', 2),
        resultPage([{ n: { value: '2' } }], fields, undefined, 2),
      ],
    });
    const connector = await connect({ projectId: 'demo-project', defaultRowLimit: 1 }, stub);
    try {
      const result = await connector.query('SELECT n FROM t ORDER BY n');
      expect(result.rows).toEqual([{ n: '1' }, { n: '2' }]);
      expect(result.truncatedBy).toBeUndefined();
      expect(stub.job.getQueryResults).toHaveBeenCalledTimes(2);
      expect(stub.job.getQueryResults).toHaveBeenLastCalledWith(expect.objectContaining({ pageToken: 'page-2' }));
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

describe('BigQuery public API (SDK responses stubbed)', () => {
  const source = {
    type: 'bigquery' as const,
    options: { projectId: 'demo-project', dataset: 'sales' },
  };

  function stubProductionPages(pages: unknown[]) {
    const job = jobWithPages(pages);
    const createQueryJob = vi
      .spyOn(BigQuery.prototype, 'createQueryJob')
      .mockImplementation(async () => [job, {}] as never);
    return { job, createQueryJob };
  }

  it('returns native result column types through ava.query()', async () => {
    const fields = [
      { name: 'id', type: 'INT64' },
      { name: 'at', type: 'TIMESTAMP' },
    ];
    stubProductionPages([
      resultPage(
        [{ id: { value: '9007199254740993' }, at: { value: '2023-01-02T10:00:00.000Z' } }],
        fields
      ),
    ]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await ava.source(source);
      const result = await ava.query('SELECT id, at FROM events');
      expect(result.schema).toEqual(fields);
      expect(result.data).toEqual([{ id: '9007199254740993', at: '2023-01-02T10:00:00.000Z' }]);
    } finally {
      await ava.dispose();
    }
  });

  it('preserves the native schema for an empty public query result', async () => {
    const fields = [{ name: 'n', type: 'INT64' }];
    const { job } = stubProductionPages([resultPage([], fields)]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await ava.source(source);
      const result = await ava.query('SELECT n FROM t WHERE FALSE');
      expect(result).toMatchObject({ data: [], schema: fields, rowCount: 0 });
      expect(job.getMetadata).not.toHaveBeenCalled();
    } finally {
      await ava.dispose();
    }
  });

  it('paginates in server order, preserves the original ORDER BY, and reports maxRows truncation', async () => {
    const fields = [{ name: 'n', type: 'INT64' }];
    const { job, createQueryJob } = stubProductionPages([
      resultPage([{ n: { value: '1' } }], fields, 'page-2', 3),
      resultPage([{ n: { value: '2' } }], fields, 'page-3', 3),
      resultPage([{ n: { value: '3' } }], fields, undefined, 3),
    ]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    const sql = 'SELECT n FROM t ORDER BY n';
    try {
      await ava.source({
        ...source,
        options: { ...source.options, defaultRowLimit: 1 },
      });
      const result = await ava.query(sql, { maxRows: 2 });
      expect(result.data).toEqual([{ n: '1' }, { n: '2' }]);
      expect(result.schema).toEqual(fields);
      expect(result).toMatchObject({ truncated: true, truncatedBy: 'maxRows' });
      expect(result.rowCount).toBeUndefined();
      expect(createQueryJob.mock.calls[0][0]).toEqual(expect.objectContaining({ query: sql }));
      expect(createQueryJob.mock.calls[0][0].query).not.toContain('__ava_query');
      expect(job.getQueryResults).toHaveBeenCalledTimes(2);
      expect(job.getQueryResults).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ maxResults: 1, autoPaginate: false })
      );
      expect(job.getQueryResults).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ maxResults: 1, pageToken: 'page-2', autoPaginate: false })
      );
    } finally {
      await ava.dispose();
    }
  });

  it('stops reading pages when the decoded output byte budget is exhausted', async () => {
    const fields = [{ name: 'n', type: 'INT64' }];
    const { job } = stubProductionPages([
      resultPage([{ n: { value: '1' } }], fields, 'page-2', 3),
      resultPage([{ n: { value: '2' } }], fields, 'page-3', 3),
      resultPage([{ n: { value: '3' } }], fields, undefined, 3),
    ]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    const oneRowBytes = Buffer.byteLength(JSON.stringify({ n: '1' }), 'utf8');
    try {
      await ava.source({
        ...source,
        options: { ...source.options, defaultRowLimit: 1 },
      });
      const result = await ava.query('SELECT n FROM t ORDER BY n', {
        maxRows: 10,
        maxResultBytes: oneRowBytes + 1,
      });
      expect(result.data).toEqual([{ n: '1' }]);
      expect(result).toMatchObject({ truncated: true, truncatedBy: 'maxResultBytes' });
      expect(job.getQueryResults).toHaveBeenCalledTimes(2);
    } finally {
      await ava.dispose();
    }
  });

  it('does not report truncation when a complete result exactly matches both output budgets', async () => {
    const fields = [{ name: 'n', type: 'INT64' }];
    const rows = [{ n: { value: '1' } }, { n: { value: '2' } }];
    const { job } = stubProductionPages([resultPage(rows, fields)]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    const exactBytes = rows.reduce(
      (total, row) => total + Buffer.byteLength(JSON.stringify({ n: (row.n as { value: string }).value }), 'utf8'),
      0
    );
    try {
      await ava.source(source);
      const result = await ava.query('SELECT n FROM t ORDER BY n', {
        maxRows: rows.length,
        maxResultBytes: exactBytes,
      });
      expect(result.data).toEqual([{ n: '1' }, { n: '2' }]);
      expect(result).toMatchObject({ rowCount: 2 });
      expect(result.truncated).toBeUndefined();
      expect(result.truncatedBy).toBeUndefined();
      expect(job.getQueryResults).toHaveBeenCalledTimes(1);
    } finally {
      await ava.dispose();
    }
  });

  it('omits the crossing row within a page without requesting another page', async () => {
    const fields = [{ name: 'n', type: 'INT64' }];
    const { job } = stubProductionPages([
      resultPage([{ n: { value: '1' } }, { n: { value: '2' } }], fields),
    ]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    const oneRowBytes = Buffer.byteLength(JSON.stringify({ n: '1' }), 'utf8');
    try {
      await ava.source(source);
      const result = await ava.query('SELECT n FROM t ORDER BY n', {
        maxRows: 10,
        maxResultBytes: oneRowBytes,
      });
      expect(result.data).toEqual([{ n: '1' }]);
      expect(result).toMatchObject({ truncated: true, truncatedBy: 'maxResultBytes' });
      expect(job.getQueryResults).toHaveBeenCalledTimes(1);
    } finally {
      await ava.dispose();
    }
  });

  it('rejects malformed credential JSON during ava.source() before any query job', async () => {
    const createQueryJob = vi.spyOn(BigQuery.prototype, 'createQueryJob');
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await expect(
        ava.source({
          ...source,
          options: { ...source.options, credentials: '{not-json' },
        })
      ).rejects.toThrow('BigQuery credentials must be a valid service-account JSON object string');
      expect(createQueryJob).not.toHaveBeenCalled();
    } finally {
      await ava.dispose();
    }
  });

  it('exhausts production profile pages beyond the public default row budget', async () => {
    const fields = [{ name: 'm0', type: 'INT64' }];
    // Synthetic multiple aggregate rows make an accidental public maxRows=200
    // limit observable; profiling still consumes only the first decoded row.
    const pages = Array.from({ length: 201 }, (_, index) =>
      resultPage(
        [{ m0: { value: String(index + 1) } }],
        fields,
        index < 200 ? `profile-${index + 2}` : undefined,
        201
      )
    );
    const { job } = stubProductionPages(pages);
    const engine = new BigQueryEngine(getLLMConfig());
    const profileSchema: Schema = {
      models: [
        {
          name: 'events',
          tableReference: { catalog: 'demo-project', schema: 'sales', table: 'events' },
          columns: [],
        },
      ],
    };
    try {
      await engine.load(source);
      const profile = await engine.profile(profileSchema, { metrics: [{ id: 'row_count' }] });
      expect(profile.models[0].metrics.row_count).toBe(1);
      expect(job.getQueryResults).toHaveBeenCalledTimes(201);
      expect(job.getQueryResults).toHaveBeenLastCalledWith(expect.objectContaining({ pageToken: 'profile-201' }));
    } finally {
      await engine.dispose();
    }
  });

  const tableFields: Field[] = [
    { name: 'table_catalog', type: 'STRING' },
    { name: 'table_schema', type: 'STRING' },
    { name: 'table_name', type: 'STRING' },
  ];
  const columnFields: Field[] = [
    { name: 'table_catalog', type: 'STRING' },
    { name: 'table_schema', type: 'STRING' },
    { name: 'table_name', type: 'STRING' },
    { name: 'column_name', type: 'STRING' },
    { name: 'ordinal_position', type: 'INT64' },
    { name: 'is_nullable', type: 'STRING' },
    { name: 'data_type', type: 'STRING' },
  ];

  function stubSchema(columnPages: unknown[]) {
    const tables = jobWithPages([
      resultPage(
        [{ table_catalog: 'demo-project', table_schema: 'sales', table_name: 'events' }],
        tableFields
      ),
    ]);
    const columns = jobWithPages(columnPages);
    const keys = jobWithPages([
      resultPage(
        [],
        ['table_name', 'column_name', 'constraint_name', 'ordinal_position'].map((name) => ({
          name,
          type: name === 'ordinal_position' ? 'INT64' : 'STRING',
        }))
      ),
    ]);
    const constraints = jobWithPages([
      resultPage(
        [],
        ['table_name', 'constraint_name', 'constraint_type'].map((name) => ({ name, type: 'STRING' }))
      ),
    ]);
    const createQueryJob = vi
      .spyOn(BigQuery.prototype, 'createQueryJob')
      .mockImplementation(async (options) => {
        const sql = options.query ?? '';
        if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) return [columns, {}] as never;
        if (sql.includes('INFORMATION_SCHEMA.KEY_COLUMN_USAGE')) return [keys, {}] as never;
        if (sql.includes('INFORMATION_SCHEMA.TABLE_CONSTRAINTS')) return [constraints, {}] as never;
        return [tables, {}] as never;
      });
    return { tables, columns, keys, constraints, createQueryJob };
  }

  function columnRow(name: string, position: number, type: string) {
    return {
      table_catalog: 'demo-project',
      table_schema: 'sales',
      table_name: 'events',
      column_name: name,
      ordinal_position: { value: String(position) },
      is_nullable: 'YES',
      data_type: type,
    };
  }

  it('reads every INFORMATION_SCHEMA page instead of applying the public row budget', async () => {
    const { tables, columns } = stubSchema([
      resultPage([columnRow('id', 1, 'INT64')], columnFields, 'columns-2', 2),
      resultPage([columnRow('at', 2, 'TIMESTAMP')], columnFields, undefined, 2),
    ]);
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await ava.source({
        ...source,
        options: { ...source.options, defaultRowLimit: 1 },
      });
      const schema = await ava.schema();
      expect(schema.models[0].columns).toEqual([
        { name: 'id', type: 'INT64', notNull: false },
        { name: 'at', type: 'TIMESTAMP', notNull: false },
      ]);
      expect(tables.getQueryResults).toHaveBeenCalledTimes(1);
      expect(columns.getQueryResults).toHaveBeenCalledTimes(2);
    } finally {
      await ava.dispose();
    }
  });

  it('fails schema discovery rather than returning partial columns when a later page fails', async () => {
    const { columns } = stubSchema([
      resultPage([columnRow('id', 1, 'INT64')], columnFields, 'columns-2', 2),
    ]);
    columns.getQueryResults.mockRejectedValueOnce(new Error('column page 2 failed'));
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await ava.source({
        ...source,
        options: { ...source.options, defaultRowLimit: 1 },
      });
      await expect(ava.schema()).rejects.toThrow('column page 2 failed');
      expect(columns.getQueryResults).toHaveBeenCalledTimes(2);
    } finally {
      await ava.dispose();
    }
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

  it('retains selected column metadata when a mock query returns no rows', async () => {
    const connector = new MockQueryConnector({
      projectId: 'demo',
      dataset: 'sales',
      tables: BIGQUERY_TABLE_SEED,
    } as never);
    await connector.connect();
    try {
      const result = await connector.query("SELECT order_id, region FROM orders WHERE region = 'missing'");
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([
        { name: 'order_id', type: 'INT64' },
        { name: 'region', type: 'STRING' },
      ]);
    } finally {
      await connector.close();
    }
  });
});