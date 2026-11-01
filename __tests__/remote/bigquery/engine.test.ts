/**
 * Unit tests for BigQueryEngine against a stubbed BigQuery REST API; no network or credentials.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { BigQueryEngine } from '../../../src/remote/bigquery';
import { getLLMConfig } from '../../test-utils';

import type { BigQuerySourceOptions } from '../../../src/types';

interface Request {
  origin: string;
  method: string;
  path: string;
  query: URLSearchParams;
  body?: any;
  authorization?: string;
}

type Handler = (request: Request) => unknown;

const SOURCE: BigQuerySourceOptions = { projectId: 'jobs', dataset: 'warehouse.sales', accessToken: 'token' };
const FIELDS = [
  { name: 'region', type: 'STRING', mode: 'NULLABLE' },
  { name: 'orders', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'revenue', type: 'NUMERIC', mode: 'NULLABLE' },
];

function error(status: number, reason: string, message: string) {
  return Response.json({ error: { code: status, message, errors: [{ reason, message }] } }, { status });
}

function rows(...values: unknown[][]) {
  return values.map((row) => ({ f: row.map((v) => ({ v })) }));
}

/** Stub fetch with a BigQuery REST handler; the default handler accepts loading and dry runs. */
function stubBigQuery(handler: Handler = () => undefined) {
  const requests: Request[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (
        input: string | URL,
        init: { method?: string; body?: unknown; headers?: unknown; signal?: AbortSignal } = {}
      ) => {
        const url = new URL(String(input));
        const request: Request = {
          origin: url.origin,
          method: init.method ?? 'GET',
          path: url.pathname.replace(/^\/bigquery\/v2\//, ''),
          query: url.searchParams,
          body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
          authorization: (init.headers as Record<string, string>)?.Authorization,
        };
        requests.push(request);
        const signal = init.signal;
        const answer = Promise.resolve(handler(request)).then((value) => {
          if (value instanceof Response) return value;
          if (value) return Response.json(value);
          if (request.method === 'GET' && request.path === 'projects/warehouse/datasets/sales') {
            return Response.json({ location: 'asia-east1' });
          }
          if (request.body?.dryRun) return Response.json({ statementType: 'SELECT', jobComplete: true });
          return error(500, 'internalError', `unhandled ${request.method} ${request.path}`);
        });
        return new Promise<Response>((resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
          answer.then(resolve, reject);
        });
      }
    )
  );
  return requests;
}

async function loaded(handler?: Handler, options: Partial<BigQuerySourceOptions> = {}) {
  const requests = stubBigQuery(handler);
  const engine = new BigQueryEngine(getLLMConfig());
  await engine.load({ type: 'bigquery', options: { ...SOURCE, ...options } });
  return { engine, requests };
}

const jobRequests = (requests: Request[]) =>
  requests.filter(({ method, path, body }) => method === 'POST' && path === 'projects/jobs/queries' && !body.dryRun);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('BigQueryEngine loading', () => {
  it('checks the dataset and the job project before accepting a source', async () => {
    const { engine, requests } = await loaded();
    expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([
      'GET projects/warehouse/datasets/sales',
      'POST projects/jobs/queries',
    ]);
    expect(requests[1].body).toEqual({
      query: 'SELECT 1',
      useLegacySql: false,
      defaultDataset: { projectId: 'warehouse', datasetId: 'sales' },
      location: 'asia-east1',
      dryRun: true,
    });
    expect(requests.every(({ authorization }) => authorization === 'Bearer token')).toBe(true);
    expect(requests.every(({ origin }) => origin === 'https://bigquery.googleapis.com')).toBe(true);
    await engine.dispose();
  });

  it('sends every request to a custom apiEndpoint', async () => {
    const { requests } = await loaded(undefined, { apiEndpoint: 'http://127.0.0.1:9050/' });
    expect(requests.map(({ origin, path }) => `${origin} ${path}`)).toEqual([
      'http://127.0.0.1:9050 projects/warehouse/datasets/sales',
      'http://127.0.0.1:9050 projects/jobs/queries',
    ]);
  });

  it('defaults the dataset project and job project from the environment', async () => {
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', 'env-project');
    const requests = stubBigQuery(({ method, path }) =>
      method === 'GET' && path === 'projects/env-project/datasets/sales' ? { location: 'US' } : undefined
    );
    const engine = new BigQueryEngine(getLLMConfig());
    await engine.load({ type: 'bigquery', options: { dataset: 'sales', accessToken: 'token' } });
    expect(requests[1].path).toBe('projects/env-project/queries');
    expect(requests[1].body.defaultDataset).toEqual({ projectId: 'env-project', datasetId: 'sales' });
  });

  it.each<{ options: Partial<BigQuerySourceOptions>; message: string }>([
    { options: { dataset: 'sales-2024' }, message: 'Invalid BigQuery dataset' },
    { options: { dataset: '.sales' }, message: 'Invalid BigQuery dataset' },
    { options: { tables: [] }, message: 'non-empty list of unique table names' },
    { options: { tables: ['orders', 'orders'] }, message: 'non-empty list of unique table names' },
    { options: { maximumBytesBilled: 0 }, message: 'maximumBytesBilled must be a positive integer' },
    { options: { queryTimeoutMs: 1.5 }, message: 'queryTimeoutMs must be a positive integer' },
    { options: { apiEndpoint: 'ftp://bigquery' }, message: 'apiEndpoint must be an http(s) URL' },
    { options: { projectId: undefined }, message: 'require projectId' },
  ])('rejects invalid options before calling BigQuery: $message', async ({ options, message }) => {
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', '');
    vi.stubEnv('GCLOUD_PROJECT', '');
    const requests = stubBigQuery();
    const engine = new BigQueryEngine(getLLMConfig());
    await expect(engine.load({ type: 'bigquery', options: { ...SOURCE, ...options } })).rejects.toThrow(message);
    expect(requests).toEqual([]);
  });

  it('explains missing datasets and missing job permissions', async () => {
    stubBigQuery(() => error(404, 'notFound', 'Not found: Dataset warehouse:sales'));
    const engine = new BigQueryEngine(getLLMConfig());
    await expect(engine.load({ type: 'bigquery', options: SOURCE })).rejects.toThrow(
      'BigQuery API error 404 (notFound): Not found: Dataset warehouse:sales. Check that dataset warehouse.sales exists and that projectId jobs is correct.'
    );

    stubBigQuery(({ body }) =>
      body?.dryRun
        ? error(403, 'accessDenied', 'Access Denied: Project jobs: User does not have bigquery.jobs.create permission')
        : undefined
    );
    await expect(engine.load({ type: 'bigquery', options: SOURCE })).rejects.toThrow(
      'roles/bigquery.jobUser on project jobs and roles/bigquery.dataViewer on dataset warehouse.sales'
    );
  });

  it('fails on unusable credentials without calling or retrying BigQuery', async () => {
    const requests = stubBigQuery();
    const engine = new BigQueryEngine(getLLMConfig());
    const credentials = {
      type: 'service_account' as const,
      client_email: 'reader@jobs.test',
      private_key: 'not a key',
    };
    await expect(
      engine.load({ type: 'bigquery', options: { projectId: 'jobs', dataset: 'warehouse.sales', credentials } })
    ).rejects.toThrow('private_key in credentials is not a valid PEM private key');
    expect(requests).toEqual([]);
  });

  it('rejects other source types and requires a loaded source', async () => {
    const engine = new BigQueryEngine(getLLMConfig());
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
    await expect(engine.load({ type: 'csv-file', options: { path: 'sales.csv' } })).rejects.toThrow(
      "BigQueryEngine only supports 'bigquery' data sources, got 'csv-file'"
    );
  });
});

describe('BigQueryEngine schema', () => {
  it('reads tables in parallel and maps types, keys, relationships and views', async () => {
    const table = (tableId: string, extra: object) => ({
      tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId },
      ...extra,
    });
    const { engine, requests } = await loaded(({ method, path, query }) => {
      if (method !== 'GET') return undefined;
      if (path === 'projects/warehouse/datasets/sales/tables') {
        return query.get('pageToken')
          ? { tables: [table('order items', { type: 'TABLE' }), table('daily', { type: 'MATERIALIZED_VIEW' })] }
          : {
              nextPageToken: 'page-2',
              tables: [
                table('customers', { type: 'TABLE' }),
                table('legacy_view', { type: 'VIEW', view: { useLegacySql: true } }),
                table('orders', { type: 'TABLE' }),
                table('paid', { type: 'VIEW', view: { useLegacySql: false } }),
              ],
            };
      }
      const tables: Record<string, object> = {
        customers: table('customers', {
          type: 'TABLE',
          schema: {
            fields: [
              { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
              { name: 'address', type: 'RECORD', fields: [{ name: 'city', type: 'STRING' }] },
            ],
          },
          tableConstraints: { primaryKey: { columns: ['id'] } },
        }),
        orders: table('orders', {
          type: 'TABLE',
          schema: {
            fields: [
              { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
              { name: 'customer_id', type: 'INTEGER' },
              { name: 'amount', type: 'NUMERIC', precision: '10', scale: '2' },
            ],
          },
          tableConstraints: {
            primaryKey: { columns: ['id'] },
            foreignKeys: [
              {
                name: 'fk_customer',
                referencedTable: { projectId: 'warehouse', datasetId: 'sales', tableId: 'customers' },
                columnReferences: [{ referencingColumn: 'customer_id', referencedColumn: 'id' }],
              },
              {
                name: 'fk_elsewhere',
                referencedTable: { projectId: 'warehouse', datasetId: 'crm', tableId: 'customers' },
                columnReferences: [{ referencingColumn: 'customer_id', referencedColumn: 'id' }],
              },
            ],
          },
        }),
        'order items': table('order items', {
          type: 'TABLE',
          schema: { fields: [{ name: 'order id', type: 'INTEGER' }] },
          tableConstraints: {
            foreignKeys: [
              {
                referencedTable: { projectId: 'warehouse', datasetId: 'sales', tableId: 'orders' },
                columnReferences: [{ referencingColumn: 'order id', referencedColumn: 'id' }],
              },
            ],
          },
        }),
        paid: table('paid', {
          type: 'VIEW',
          schema: { fields: [{ name: 'id', type: 'INTEGER' }] },
          view: { query: 'SELECT id FROM orders WHERE paid', useLegacySql: false },
        }),
        daily: table('daily', { type: 'MATERIALIZED_VIEW', schema: { fields: [{ name: 'day', type: 'DATE' }] } }),
      };
      const id = decodeURIComponent(path.split('/tables/')[1] ?? '');
      return tables[id];
    });

    const schema = await engine.schema();
    const reads = requests.filter(({ path }) => path.includes('/tables/'));
    expect(reads.map(({ path }) => decodeURIComponent(path.split('/tables/')[1])).sort()).toEqual([
      'customers',
      'daily',
      'order items',
      'orders',
      'paid',
    ]);
    expect(reads.every(({ query }) => query.get('view') === 'BASIC')).toBe(true);
    expect(schema).toEqual({
      models: [
        {
          name: 'customers',
          tableReference: { catalog: 'warehouse', schema: 'sales', table: 'customers' },
          columns: [
            { name: 'id', type: 'INT64', notNull: true },
            { name: 'address', type: 'STRUCT<city STRING>', notNull: false },
          ],
          primaryKey: 'id',
        },
        {
          name: 'daily',
          tableReference: { catalog: 'warehouse', schema: 'sales', table: 'daily' },
          columns: [{ name: 'day', type: 'DATE', notNull: false }],
        },
        {
          name: 'order items',
          tableReference: { catalog: 'warehouse', schema: 'sales', table: 'order items' },
          columns: [{ name: 'order id', type: 'INT64', notNull: false }],
        },
        {
          name: 'orders',
          tableReference: { catalog: 'warehouse', schema: 'sales', table: 'orders' },
          columns: [
            { name: 'id', type: 'INT64', notNull: true },
            { name: 'customer_id', type: 'INT64', notNull: false },
            { name: 'amount', type: 'NUMERIC(10, 2)', notNull: false },
          ],
          primaryKey: 'id',
        },
        {
          name: 'paid',
          tableReference: { catalog: 'warehouse', schema: 'sales', table: 'paid' },
          columns: [{ name: 'id', type: 'INT64', notNull: false }],
        },
      ],
      relationships: [
        {
          name: 'fk:["order items",["order id"],"orders",["id"]]',
          models: ['order items', 'orders'],
          joinType: 'MANY_TO_ONE',
          condition: '`order items`.`order id` = `orders`.`id`',
        },
        {
          name: 'fk_customer',
          models: ['orders', 'customers'],
          joinType: 'MANY_TO_ONE',
          condition: '`orders`.`customer_id` = `customers`.`id`',
        },
      ],
      views: [{ name: 'paid', statement: 'SELECT id FROM orders WHERE paid' }],
    });
  });

  it('exposes date-sharded tables as one wildcard model with _TABLE_SUFFIX', async () => {
    const ids = ['events_20240101', 'events_20240103', 'events_20240102', 'events_intraday_20240104', 'orders'];
    const handler: Handler = ({ method, path }) => {
      if (method !== 'GET') return undefined;
      if (path.endsWith('/tables')) {
        return {
          tables: ids.map((tableId) => ({ tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId } })),
        };
      }
      const tableId = path.split('/tables/')[1];
      if (!tableId) return undefined;
      return {
        tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId },
        // Later shards gained a column, so the wildcard must follow the newest shard.
        schema: {
          fields: [
            { name: 'user_id', type: 'STRING' },
            ...(tableId === 'events_20240103' ? [{ name: 'country', type: 'STRING' }] : []),
          ],
        },
      };
    };
    const { engine, requests } = await loaded(handler);
    const schema = await engine.schema();
    expect(
      requests.filter(({ path }) => path.includes('/tables/')).map(({ path }) => path.split('/tables/')[1])
    ).toEqual(['events_intraday_20240104', 'orders', 'events_20240103']);
    expect(schema.models.map(({ name }) => name)).toEqual(['events_*', 'events_intraday_20240104', 'orders']);
    expect(schema.models[0]).toEqual({
      name: 'events_*',
      tableReference: { catalog: 'warehouse', schema: 'sales', table: 'events_*' },
      columns: [
        { name: 'user_id', type: 'STRING', notNull: false },
        { name: 'country', type: 'STRING', notNull: false },
        { name: '_TABLE_SUFFIX', type: 'STRING', notNull: true },
      ],
    });

    const { engine: selected } = await loaded(handler, { tables: ['events_*', 'events_20240101'] });
    expect((await selected.schema()).models.map(({ name }) => name)).toEqual(['events_*', 'events_20240101']);
  });

  it('reports requested tables that are missing or not queryable', async () => {
    const { engine } = await loaded(
      ({ path }) =>
        path.endsWith('/tables') && {
          tables: [
            { tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId: 'orders' }, type: 'TABLE' },
            {
              tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId: 'legacy' },
              type: 'VIEW',
              view: { useLegacySql: true },
            },
          ],
        },
      { tables: ['orders', 'legacy', 'missing'] }
    );
    await expect(engine.schema()).rejects.toThrow(
      'BigQuery dataset warehouse.sales has no queryable table named "legacy", "missing"'
    );
  });
});

describe('BigQueryEngine queries', () => {
  it('dry-runs, then reads maxRows + 1 rows in result order without rewriting the SQL', async () => {
    const sql = 'SELECT region, COUNT(*) AS orders, SUM(amount) AS revenue FROM orders GROUP BY region ORDER BY 3 DESC';
    const { engine, requests } = await loaded(({ body }) =>
      body && !body.dryRun
        ? {
            jobComplete: true,
            jobReference: { projectId: 'jobs', jobId: 'job-1', location: 'asia-east1' },
            schema: { fields: FIELDS },
            totalRows: '3',
            rows: rows(
              ['East', '12', '1200.5'],
              ['West', '9007199254740993', '12345678901234567890.1'],
              [null, '1', '1']
            ),
          }
        : undefined
    );

    const result = await engine.execute(sql, { maxRows: 2 });
    expect(result).toEqual({
      data: [
        { region: 'East', orders: 12, revenue: 1200.5 },
        { region: 'West', orders: '9007199254740993', revenue: '12345678901234567890.1' },
      ],
      schema: [
        { name: 'region', type: 'STRING' },
        { name: 'orders', type: 'INT64' },
        { name: 'revenue', type: 'NUMERIC' },
      ],
      truncated: true,
      truncatedBy: 'maxRows',
      rowCount: undefined,
    });
    const [dryRun, job] = requests.slice(2);
    expect(dryRun.body).toEqual({
      query: sql,
      useLegacySql: false,
      defaultDataset: { projectId: 'warehouse', datasetId: 'sales' },
      location: 'asia-east1',
      dryRun: true,
    });
    expect(job.body).toEqual({
      query: sql,
      useLegacySql: false,
      defaultDataset: { projectId: 'warehouse', datasetId: 'sales' },
      location: 'asia-east1',
      maximumBytesBilled: '1073741824',
      jobTimeoutMs: '30000',
      timeoutMs: expect.any(Number),
      maxResults: 3,
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      formatOptions: { useInt64Timestamp: true },
    });
    expect(job.body.timeoutMs).toBeLessThanOrEqual(10_000);
    await engine.dispose();
  });

  it('polls unfinished jobs and reads later pages until the row limit', async () => {
    const job = { projectId: 'jobs', jobId: 'job-2', location: 'asia-east1' };
    let polls = 0;
    const { engine, requests } = await loaded(({ method, path, query, body }) => {
      if (method === 'POST' && body && !body.dryRun) return { jobComplete: false, jobReference: job };
      if (method === 'GET' && path === 'projects/jobs/queries/job-2') {
        polls += 1;
        if (polls === 1) return { jobComplete: false, jobReference: job };
        if (!query.get('pageToken')) {
          return {
            jobComplete: true,
            jobReference: job,
            schema: { fields: FIELDS },
            rows: rows(['East', '1', '1']),
            pageToken: 'p2',
          };
        }
        return { jobComplete: true, jobReference: job, schema: { fields: FIELDS }, rows: rows(['West', '2', '2']) };
      }
      return undefined;
    });

    const result = await engine.execute('SELECT region, orders, revenue FROM totals');
    expect(result).toMatchObject({
      data: [
        { region: 'East', orders: 1, revenue: 1 },
        { region: 'West', orders: 2, revenue: 2 },
      ],
      rowCount: 2,
    });
    expect(result.truncated).toBeUndefined();
    const reads = requests.filter(({ path }) => path === 'projects/jobs/queries/job-2');
    expect(reads.map(({ query }) => Object.fromEntries(query))).toEqual([
      expect.objectContaining({ location: 'asia-east1', maxResults: '201', 'formatOptions.useInt64Timestamp': 'true' }),
      expect.objectContaining({ location: 'asia-east1', maxResults: '201' }),
      expect.objectContaining({ location: 'asia-east1', maxResults: '200', pageToken: 'p2' }),
    ]);
  });

  it('stops reading pages once the byte budget is spent', async () => {
    const job = { projectId: 'jobs', jobId: 'job-3', location: 'asia-east1' };
    const { engine, requests } = await loaded(({ method, body }) =>
      method === 'POST' && body && !body.dryRun
        ? {
            jobComplete: true,
            jobReference: job,
            schema: { fields: FIELDS },
            rows: rows(['East', '1', '1'], ['West', '2', '2']),
            pageToken: 'more',
          }
        : undefined
    );
    const result = await engine.execute('SELECT * FROM totals', { maxResultBytes: 60 });
    expect(result).toMatchObject({ data: [{ region: 'East' }], truncated: true, truncatedBy: 'maxResultBytes' });
    expect(requests.some(({ query }) => query.get('pageToken'))).toBe(false);
  });

  it.each(['SCRIPT', 'DELETE', 'CREATE_TABLE_AS_SELECT', 'EXPORT_DATA', undefined])(
    'refuses statement type %s before creating a job',
    async (statementType) => {
      const { engine, requests } = await loaded(({ body }) =>
        body?.dryRun && body.query !== 'SELECT 1' ? { statementType, jobComplete: true } : undefined
      );
      await expect(engine.execute('statement')).rejects.toThrow(
        'BigQuery query must be one read-only SELECT statement'
      );
      expect(jobRequests(requests)).toEqual([]);
    }
  );

  it('surfaces dry-run errors for query correction', async () => {
    const { engine } = await loaded(({ body }) =>
      body?.dryRun && body.query !== 'SELECT 1'
        ? error(400, 'invalidQuery', 'Unrecognized name: amont; Did you mean amount? at [1:8]')
        : undefined
    );
    await expect(engine.execute('SELECT amont FROM orders')).rejects.toThrow(
      'BigQuery API error 400 (invalidQuery): Unrecognized name: amont; Did you mean amount? at [1:8]'
    );
  });

  it('retries transient failures with the same requestId', async () => {
    let attempts = 0;
    const { engine, requests } = await loaded(({ body }) => {
      if (!body || body.dryRun) return undefined;
      attempts += 1;
      return attempts === 1
        ? error(503, 'backendError', 'Backend error')
        : { jobComplete: true, schema: { fields: FIELDS }, rows: [] };
    });
    await expect(engine.execute('SELECT * FROM totals')).resolves.toMatchObject({ data: [], rowCount: 0 });
    const [first, second] = jobRequests(requests);
    expect(second.body.requestId).toBe(first.body.requestId);
  });

  it('adds the byte limit to bytesBilledLimitExceeded errors', async () => {
    const { engine } = await loaded(
      ({ body }) =>
        body &&
        !body.dryRun &&
        error(
          400,
          'bytesBilledLimitExceeded',
          'Query exceeded limit for bytes billed: 1000. 10485760 or higher required.'
        ),
      { maximumBytesBilled: 1000 }
    );
    await expect(engine.execute('SELECT * FROM orders')).rejects.toThrow(
      'Query exceeded limit for bytes billed: 1000. 10485760 or higher required. The source allows 1000 bytes billed per query (maximumBytesBilled)'
    );
  });

  it('cancels jobs that exceed queryTimeoutMs', async () => {
    const job = { projectId: 'jobs', jobId: 'slow', location: 'asia-east1' };
    const { engine, requests } = await loaded(
      async ({ method, path, body }) => {
        if (method === 'POST' && body && !body.dryRun) return { jobComplete: false, jobReference: job };
        if (path === 'projects/jobs/queries/slow') {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return { jobComplete: false, jobReference: job };
        }
        if (path === 'projects/jobs/jobs/slow/cancel') return { job: {} };
        return undefined;
      },
      { queryTimeoutMs: 100 }
    );
    await expect(engine.execute('SELECT 1')).rejects.toThrow('queryTimeoutMs (100 ms)');
    expect(jobRequests(requests)[0].body.jobTimeoutMs).toBe('100');
    const cancel = requests.find(({ path }) => path === 'projects/jobs/jobs/slow/cancel');
    expect(cancel?.method).toBe('POST');
    expect(cancel?.query.get('location')).toBe('asia-east1');
  });

  it('cancels the running job when the engine is disposed', async () => {
    const job = { projectId: 'jobs', jobId: 'running', location: 'asia-east1' };
    let polling: () => void;
    const started = new Promise<void>((resolve) => {
      polling = resolve;
    });
    const { engine, requests } = await loaded(({ method, path, body }) => {
      if (method === 'POST' && body && !body.dryRun) return { jobComplete: false, jobReference: job };
      if (path === 'projects/jobs/queries/running') {
        polling();
        return new Promise(() => undefined);
      }
      if (path === 'projects/jobs/jobs/running/cancel') return { job: {} };
      return undefined;
    });
    const execution = engine.execute('SELECT 1');
    await started;
    await engine.dispose();
    await expect(execution).rejects.toThrow('BigQuery engine was disposed');
    expect(requests.some(({ path }) => path === 'projects/jobs/jobs/running/cancel')).toBe(true);
  });

  it('runs through AVA with the bigquery engine', async () => {
    stubBigQuery(({ method, path, body }) => {
      if (method === 'GET' && path === 'projects/warehouse/datasets/sales/tables') {
        return { tables: [{ tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId: 'orders' } }] };
      }
      if (method === 'GET' && path === 'projects/warehouse/datasets/sales/tables/orders') {
        return {
          tableReference: { projectId: 'warehouse', datasetId: 'sales', tableId: 'orders' },
          schema: { fields: [{ name: 'region', type: 'STRING' }] },
        };
      }
      if (body && !body.dryRun) {
        return { jobComplete: true, schema: { fields: FIELDS.slice(0, 1) }, rows: rows(['East']) };
      }
      return undefined;
    });
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
    try {
      await ava.source({ type: 'bigquery', options: SOURCE });
      expect(ava.engine?.language).toMatchObject({ name: 'BigQuery GoogleSQL dialect', fence: 'sql' });
      expect((await ava.schema()).models.map(({ name }) => name)).toEqual(['orders']);
      expect((await ava.query('SELECT region FROM orders')).data).toEqual([{ region: 'East' }]);
    } finally {
      await ava.dispose();
    }
  });
});
