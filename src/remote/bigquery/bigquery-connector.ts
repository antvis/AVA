/**
 * BigQuery connector built on the `@google-cloud/bigquery` client. Statements
 * always run through a query job configured with the source options. Because
 * the service account may still own write privileges, BigQueryEngine
 * additionally validates each statement as a single read-only SELECT before it
 * reaches this connector.
 *
 * Bounds and budget live in separate layers:
 *   - Budget: `maximumBytesBilled` is sent with the job (`IJobConfigurationQuery`,
 *     server-side guard) AND checked against a dry run before the billable job
 *     is created, so queries over the configured budget are rejected up front.
 *   - Rows/result bytes: bounded at the result-read interface. Pages are read
 *     manually (`autoPaginate: false`) until a decoded-output budget stops the
 *     read; `defaultRowLimit` only controls each request's `maxResults`.
 *   - Metadata/profile queries have no output limit and exhaust every page.
 *   - `useLegacySql: false` only selects the GoogleSQL dialect; read-only is
 *     enforced by the local validator and a reader-role service account.
 *
 * Values are decoded losslessly (see `decodeValue`): `INT64` keeps exact digits
 * (driver `BigQueryInt` wrappers), `DATE`, `DATETIME`, `TIME` surface the
 * server format string, `TIMESTAMP` becomes an ISO 8601 UTC string,
 * `NUMERIC`/`BIGNUMERIC` keep the full decimal string, and `BYTES` surface
 * base64. Column names and types come from successful `jobs.getQueryResults`
 * responses, including empty results; ordinary job metadata is never used as a
 * schema fallback.
 *
 * The optional driver is loaded through a deferred dynamic import so both the
 * CommonJS and ESM published builds can load it without a bare `require()`;
 * its types are imported statically (type-only, erased at runtime).
 */
import { validateReadOnlyBigQuery } from '../../query/bigquery';
import { resultRowBytes } from '../../util/result';
import { runWithTimeout } from '../../util/timeout';

import type { BigQuerySourceOptions } from '../../types';
import type { QueryColumnMeta, QueryConnector, QueryLimits, QueryResult, QueryResultRow } from './connector';
import type {
  BigQuery,
  BigQueryDate,
  BigQueryDatetime,
  BigQueryInt,
  BigQueryTime,
  BigQueryTimestamp,
  Geography,
  Job,
  Query as BigQueryQueryOptions,
  QueryResultsOptions,
  QueryRowsResponse,
  TableField,
} from '@google-cloud/bigquery';

const DRIVER_MODULE = '@google-cloud/bigquery';
const DEFAULT_TIMEOUT_MS = 60000;
let cachedModule: Promise<typeof import('@google-cloud/bigquery')> | undefined;

/** Load (and cache) the @google-cloud/bigquery bindings, throwing a clear error when absent. */
async function loadBigQuery(): Promise<typeof import('@google-cloud/bigquery')> {
  if (!cachedModule) {
    cachedModule = import(DRIVER_MODULE)
      .then((loaded) => {
        const module = loaded as typeof loaded & { default?: typeof loaded };
        return module.BigQuery ? module : (module.default ?? module);
      })
      .catch(() => {
        cachedModule = undefined;
        throw new Error(
          'BigQuery adapter requires the optional "@google-cloud/bigquery" dependency. ' +
            'Install it (npm i @google-cloud/bigquery) or set adapter: "mock" to use the in-memory connector.'
        );
      });
  }
  return cachedModule;
}

function normalizeCredentials(options: BigQuerySourceOptions): Record<string, unknown> | undefined {
  const { credentials, clientEmail, privateKey } = options;
  if (credentials !== undefined) {
    if (typeof credentials === 'string') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(credentials);
      } catch {
        throw new Error('BigQuery credentials must be a valid service-account JSON object string');
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('BigQuery credentials JSON must contain a service-account object');
      }
      return parsed as Record<string, unknown>;
    }
    return credentials;
  }
  if (clientEmail && privateKey) {
    return { client_email: clientEmail, private_key: privateKey };
  }
  return undefined;
}

function positiveInt(value: number | undefined): number | undefined {
  return value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

type ClientCredentials = import('@google-cloud/bigquery').BigQueryOptions['credentials'];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === 'function') return btoa(binary);
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  return binary;
}

/** Best-effort cancellation; the timeout error remains the primary failure. */
function cancelJob(job: Job): void {
  try {
    void job.cancel().catch(() => undefined);
  } catch {
    // A synchronously failing cancellation must not mask the query timeout.
  }
}

type StringWrapper = BigQueryInt | BigQueryDate | BigQueryDatetime | BigQueryTime | BigQueryTimestamp | Geography;

function isStringWrapper(value: unknown): value is StringWrapper {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof (value as StringWrapper).value === 'string'
  );
}

const INTEGER_TYPE = /^(?:integer|int64)$/i;
const BYTES_TYPE = /^bytes$/i;
const FLOAT_TYPE = /^(?:float|float64|double|doubleprecision|real)$/i;
const BOOLEAN_TYPE = /^bool/i;
const NUMERIC_TYPE = /^(?:big)?num/i;
const RECORD_TYPE = /^(?:record|struct)/i;

/**
 * Decode one driver value into a lossless, JSON-safe representation:
 * `INT64` keeps the exact digits as a string (the driver wraps them in
 * `BigQueryInt` when `wrapIntegers` is on); `DATE`, `DATETIME`, `TIME` keep the
 * server format string (`2023-01-02`, `2023-01-02 12:00:00`); `TIMESTAMP`
 * becomes an ISO 8601 UTC string; `NUMERIC`/`BIGNUMERIC` decode into `Big`
 * instances, surfaced as exact decimal strings; `BYTES` becomes base64;
 * `RECORD`/`STRUCT` and arrays are normalized recursively. Booleans stay
 * booleans, floats stay numbers, and unknown object values are passed through.
 */
function decodeValue(field: TableField, value: unknown): unknown {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map((entry) => decodeValue(field, entry));

  const type = (field.type ?? 'STRING').trim().toUpperCase();

  if (RECORD_TYPE.test(type)) {
    const nested = field.fields ?? [];
    if (nested.length) {
      const row = value as Record<string, unknown>;
      return Object.fromEntries(
        nested.map((entry) => {
          const name = entry.name ?? '';
          return [name, decodeValue(entry, row[name])];
        })
      );
    }
    return value;
  }

  if (INTEGER_TYPE.test(type)) {
    if (isStringWrapper(value)) return value.value;
    // wrapIntegers prevents this lossy path in normal SDK responses. Reject an
    // unsafe raw number rather than silently returning already-rounded digits.
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
      throw new Error(`BigQuery INT64 column '${field.name ?? ''}' arrived without lossless integer wrapping`);
    }
    return String(value);
  }

  if (isStringWrapper(value)) return value.value;
  if (value instanceof Date) return value.toISOString();

  if (BYTES_TYPE.test(type)) {
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return (value as Buffer).toString('base64');
    if (value instanceof ArrayBuffer) return arrayBufferToBase64(value);
    return value;
  }

  if (BOOLEAN_TYPE.test(type)) return value === true || String(value).toLowerCase() === 'true';

  if (FLOAT_TYPE.test(type)) {
    const numeric = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (NUMERIC_TYPE.test(type)) return String(value);

  if (typeof value === 'object') return value;
  return value;
}

function byteBudget(options: BigQuerySourceOptions): bigint | undefined {
  const value = options.maxBytesBilled;
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('BigQuery maxBytesBilled must be a non-negative safe integer');
  }
  return BigInt(value);
}

/** Query-job configuration; a `dryRun` config only reports, it never executes. */
function jobConfig(options: BigQuerySourceOptions, sql: string, dryRun: boolean): BigQueryQueryOptions {
  const { dataset, location, projectId } = options;
  const budget = byteBudget(options);
  return {
    query: sql,
    useLegacySql: false, // dialect selection only; read-only is validated separately
    ...(dryRun ? { dryRun: true } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(dataset ? { defaultDataset: { projectId, datasetId: dataset } } : {}),
    // Keep the estimate readable on dry runs; enforce the server-side cap on
    // the real job. The SDK's IJobConfigurationQuery uses a string here.
    ...(!dryRun && budget !== undefined ? { maximumBytesBilled: budget.toString() } : {}),
  };
}

/** Pre-flight dry run: reject queries whose estimated bytes exceed the budget. */
async function enforceBudget(client: BigQuery, options: BigQuerySourceOptions, sql: string): Promise<void> {
  const budget = byteBudget(options);
  if (budget === undefined) return;
  const [, jobMetadata] = await client.createQueryJob(jobConfig(options, sql, true));
  const rawEstimate = jobMetadata.statistics?.query?.totalBytesProcessed;
  if (rawEstimate === undefined) {
    throw new Error('BigQuery dry run did not report totalBytesProcessed; the billable job was not started');
  }

  let estimated: bigint;
  try {
    estimated = BigInt(rawEstimate);
  } catch {
    throw new Error(`BigQuery dry run returned an invalid totalBytesProcessed estimate: ${rawEstimate}`);
  }
  if (estimated > budget) {
    throw new Error(
      `BigQuery query is estimated to process ${rawEstimate} bytes, which exceeds the configured ` +
        `maximumBytesBilled budget of ${budget.toString()} bytes; the job was not started`
    );
  }
}

interface ActiveQuery {
  job?: Job;
  cancelled: boolean;
  reason?: 'close' | 'timeout';
}

function assertActive(active: ActiveQuery): void {
  if (!active.cancelled) return;
  if (active.reason === 'close') throw new Error('BigQuery connector was closed; job cancellation was requested');
  throw new Error('BigQuery query was cancelled after its timeout');
}

/** Column metadata exactly as the result API reports it. */
function columnsFrom(fields: TableField[]): QueryColumnMeta[] {
  return fields.map((field) => ({ name: field.name ?? '', type: field.type ?? 'STRING' }));
}

function rowsFrom(rows: Record<string, unknown>[], fields: TableField[]): QueryResultRow[] {
  if (!fields.length) return rows;
  return rows.map((row) =>
    Object.fromEntries(
      fields.map((field) => {
        const name = field.name ?? '';
        return [name, decodeValue(field, row[name])];
      })
    )
  );
}

function validateLimits(limits: QueryLimits | undefined): void {
  if (limits?.maxRows !== undefined && (!Number.isSafeInteger(limits.maxRows) || limits.maxRows < 1)) {
    throw new Error('BigQuery query maxRows must be a positive safe integer');
  }
  if (
    limits?.maxResultBytes !== undefined &&
    (!Number.isSafeInteger(limits.maxResultBytes) || limits.maxResultBytes < 1)
  ) {
    throw new Error('BigQuery query maxResultBytes must be a positive safe integer');
  }
}

/** Build one manual page request. The remaining row budget can reduce, but never increase, the page size. */
function readOptions(
  options: BigQuerySourceOptions,
  limits: QueryLimits | undefined,
  rowsRead: number,
  nextQuery?: QueryRowsResponse[1]
): QueryResultsOptions {
  const pageSize = positiveInt(options.defaultRowLimit);
  const remaining = limits?.maxRows === undefined ? undefined : Math.max(limits.maxRows - rowsRead, 1);
  const maxResults = remaining === undefined ? pageSize : Math.min(pageSize ?? remaining, remaining);
  return {
    ...nextQuery,
    ...(maxResults !== undefined ? { maxResults } : {}),
    wrapIntegers: true,
    autoPaginate: false,
  };
}

function hasMoreRows(
  apiResponse: QueryRowsResponse[2],
  nextQuery: QueryRowsResponse[1],
  rowsRead: number
): boolean {
  if (nextQuery?.pageToken || apiResponse?.pageToken) return true;
  const totalRows = apiResponse?.totalRows;
  if (totalRows === undefined) return false;
  try {
    return BigInt(totalRows) > BigInt(rowsRead);
  } catch {
    throw new Error(`BigQuery returned an invalid totalRows value: ${totalRows}`);
  }
}

/**
 * Poll to completion and manually read result pages in server order. Public
 * queries stop at decoded row/byte budgets; unbounded metadata/profile queries
 * continue until no page token remains. A schema is required from a successful
 * jobs.getQueryResults response, including when its rows array is empty.
 */
async function readPages(
  job: Job,
  options: BigQuerySourceOptions,
  active: ActiveQuery,
  limits?: QueryLimits
): Promise<QueryResult> {
  validateLimits(limits);
  const rows: QueryResultRow[] = [];
  let fields: TableField[] | undefined;
  let bytes = 0;
  let request = readOptions(options, limits, 0);

  for (;;) {
    assertActive(active);
    const response = await job.getQueryResults(request);
    assertActive(active);
    const nextQuery = response[1];
    const apiResponse = response[2];

    if (apiResponse?.jobComplete === false) {
      if (!nextQuery) throw new Error('BigQuery returned an incomplete query without a continuation request');
      request = readOptions(options, limits, rows.length, nextQuery);
      continue;
    }

    if (!fields) {
      fields = apiResponse?.schema?.fields;
      if (!fields?.length) {
        throw new Error('BigQuery result schema is missing from the successful jobs.getQueryResults response');
      }
    }

    const pageRows = (response[0] ?? []) as Record<string, unknown>[];
    for (const row of pageRows) {
      if (limits?.maxRows !== undefined && rows.length >= limits.maxRows) {
        return { columns: columnsFrom(fields), rows, truncatedBy: 'maxRows' };
      }
      if (limits?.maxResultBytes !== undefined && bytes >= limits.maxResultBytes) {
        return { columns: columnsFrom(fields), rows, truncatedBy: 'maxResultBytes' };
      }

      const decoded = rowsFrom([row], fields)[0];
      if (limits?.maxResultBytes !== undefined) {
        const rowBytes = resultRowBytes(decoded);
        if (bytes + rowBytes > limits.maxResultBytes) {
          return { columns: columnsFrom(fields), rows, truncatedBy: 'maxResultBytes' };
        }
        bytes += rowBytes;
      }
      rows.push(decoded);
    }

    const moreRows = hasMoreRows(apiResponse, nextQuery, rows.length);
    if (limits?.maxRows !== undefined && rows.length >= limits.maxRows && moreRows) {
      return { columns: columnsFrom(fields), rows, truncatedBy: 'maxRows' };
    }
    if (limits?.maxResultBytes !== undefined && bytes >= limits.maxResultBytes && moreRows) {
      return { columns: columnsFrom(fields), rows, truncatedBy: 'maxResultBytes' };
    }
    if (!nextQuery?.pageToken) {
      if (moreRows) {
        throw new Error('BigQuery result is incomplete: more rows were reported without a page token');
      }
      return { columns: columnsFrom(fields), rows };
    }
    request = readOptions(options, limits, rows.length, nextQuery);
  }
}

export class BigQueryQueryConnector implements QueryConnector {
  private readonly options: BigQuerySourceOptions;
  private readonly activeQueries = new Set<ActiveQuery>();
  private client: BigQuery | null = null;
  private generation = 0;

  constructor(options: BigQuerySourceOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.client) return;
    const generation = this.generation;
    // Validate explicit credentials before optional-driver loading so a bad
    // JSON string is reported as a configuration error during ava.source().
    const credentials = normalizeCredentials(this.options);
    const { BigQuery } = await loadBigQuery();
    const client = new BigQuery({
      projectId: this.options.projectId,
      ...(credentials !== undefined ? { credentials: credentials as ClientCredentials } : {}),
    });
    // close() may have run while the optional module was loading.
    if (generation === this.generation) this.client = client;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    limits?: QueryLimits
  ): Promise<QueryResult & { rows: T[] }> {
    const query = validateReadOnlyBigQuery(sql);
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const active: ActiveQuery = { cancelled: false };
    this.activeQueries.add(active);

    try {
      await this.connect();
      assertActive(active);
      const client = this.client;
      if (!client) throw new Error('BigQuery connector was closed before the client finished connecting');

      const operation = (async (): Promise<QueryResult> => {
        await enforceBudget(client, this.options, query);
        assertActive(active);
        const [createdJob] = await client.createQueryJob(jobConfig(this.options, query, false));
        active.job = createdJob;
        if (active.cancelled) cancelJob(createdJob);
        assertActive(active);

        return readPages(createdJob, this.options, active, limits);
      })();

      const response = await runWithTimeout(operation, timeoutMs, {
        onTimeout: () => {
          active.cancelled = true;
          active.reason = 'timeout';
          if (active.job) cancelJob(active.job);
          return new Error(`BigQuery query timed out after ${timeoutMs}ms; job cancellation was requested`);
        },
        unref: true,
      });
      assertActive(active);
      return response as QueryResult & { rows: T[] };
    } finally {
      this.activeQueries.delete(active);
    }
  }

  async close(): Promise<void> {
    this.generation += 1;
    this.client = null;
    for (const active of this.activeQueries) {
      active.cancelled = true;
      active.reason = 'close';
      if (active.job) cancelJob(active.job);
    }
  }
}

export { loadBigQuery, normalizeCredentials };
