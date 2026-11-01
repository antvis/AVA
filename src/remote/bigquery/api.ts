/**
 * Minimal BigQuery REST v2 client over fetch: metadata reads, dry runs and query jobs.
 * https://cloud.google.com/bigquery/docs/reference/rest
 */
import { setTimeout as sleep } from 'timers/promises';

export const DEFAULT_API_ENDPOINT = 'https://bigquery.googleapis.com';

/** Deadline for requests that are not bounded by a query timeout. */
const REQUEST_TIMEOUT_MS = 30_000;
/** Extra client wait beyond a server-side wait such as jobs.query timeoutMs. */
const RESPONSE_GRACE_MS = 5_000;
const MAX_ATTEMPTS = 4;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_REASONS = new Set(['backendError', 'internalError', 'rateLimitExceeded']);

/** A failed BigQuery or Google OAuth request. */
export class BigQueryError extends Error {
  /** HTTP status, when the API answered. */
  readonly status?: number;
  /** BigQuery error reason, e.g. `invalidQuery` or `accessDenied`. */
  readonly reason?: string;

  constructor(message: string, details: { status?: number; reason?: string } = {}) {
    super(message);
    this.name = 'BigQueryError';
    this.status = details.status;
    this.reason = details.reason;
  }
}

/** TableFieldSchema */
export interface Field {
  name: string;
  type: string;
  mode?: string;
  fields?: Field[];
  precision?: string;
  scale?: string;
  maxLength?: string;
  rangeElementType?: { type?: string };
}

export interface DatasetReference {
  projectId: string;
  datasetId: string;
}

export interface TableReference extends DatasetReference {
  tableId: string;
}

export interface TableListItem {
  tableReference: TableReference;
  type?: string;
  view?: { useLegacySql?: boolean };
}

export interface Table {
  tableReference: TableReference;
  type?: string;
  schema?: { fields?: Field[] };
  view?: { query?: string; useLegacySql?: boolean };
  tableConstraints?: {
    primaryKey?: { columns?: string[] };
    foreignKeys?: {
      name?: string;
      referencedTable?: Partial<TableReference>;
      columnReferences?: { referencingColumn: string; referencedColumn: string }[];
    }[];
  };
}

/** One row in the REST `{ f: [{ v }] }` encoding. */
export interface Row {
  f: { v: unknown }[];
}

export interface JobReference {
  projectId: string;
  jobId: string;
  location?: string;
}

/** Shared fields of QueryResponse and GetQueryResultsResponse. */
export interface QueryResults {
  jobComplete?: boolean;
  jobReference?: JobReference;
  schema?: { fields?: Field[] };
  rows?: Row[];
  pageToken?: string;
  statementType?: string;
}

/** QueryRequest fields used by AVA. */
export interface QueryRequest {
  query: string;
  useLegacySql: false;
  defaultDataset: DatasetReference;
  location?: string;
  dryRun?: boolean;
  maximumBytesBilled?: string;
  jobTimeoutMs?: string;
  timeoutMs?: number;
  maxResults?: number;
  requestId?: string;
  formatOptions?: { useInt64Timestamp: boolean };
}

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Absolute time after which the request is abandoned. */
  deadline?: number;
  signal?: AbortSignal;
}

/** Error text including the network cause that fetch wraps, e.g. `fetch failed (connect ETIMEDOUT)`. */
export function errorText(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    return cause instanceof Error ? `${error.message} (${cause.message})` : error.message;
  }
  return String(error);
}

async function responseError(response: Response): Promise<BigQueryError> {
  const text = await response.text().catch(() => '');
  let error: { message?: unknown; errors?: { reason?: unknown; message?: unknown }[] } | undefined;
  try {
    error = JSON.parse(text).error;
  } catch {
    error = undefined;
  }
  const [first] = Array.isArray(error?.errors) ? error!.errors : [];
  const reason = typeof first?.reason === 'string' ? first.reason : undefined;
  const message =
    (typeof error?.message === 'string' && error.message) ||
    (typeof first?.message === 'string' && first.message) ||
    text.slice(0, 500) ||
    response.statusText;
  return new BigQueryError(`BigQuery API error ${response.status}${reason ? ` (${reason})` : ''}: ${message}`, {
    status: response.status,
    reason,
  });
}

function retryable(error: BigQueryError): boolean {
  return (
    error.status === undefined ||
    RETRYABLE_STATUS.has(error.status) ||
    (error.reason !== undefined && RETRYABLE_REASONS.has(error.reason))
  );
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * BigQuery REST calls with bounded retries. Every request is idempotent: reads, dry runs,
 * cancellations, and jobs.query calls that carry a requestId.
 */
export class BigQueryApi {
  constructor(private readonly options: { endpoint: string; token: () => Promise<string> }) {}

  async request<T>(method: 'GET' | 'POST', path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.options.endpoint.replace(/\/+$/, '')}/bigquery/v2/${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const deadline = options.deadline ?? Date.now() + REQUEST_TIMEOUT_MS;

    for (let attempt = 1; ; attempt += 1) {
      options.signal?.throwIfAborted();
      // Credential failures are not transient, so they are not retried.
      const token = await this.options.token();
      const timeout = AbortSignal.timeout(Math.max(deadline - Date.now(), 0) + RESPONSE_GRACE_MS);
      let failure: BigQueryError;
      try {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
        });
        if (response.ok) return (await response.json()) as T;
        failure = await responseError(response);
      } catch (error) {
        options.signal?.throwIfAborted();
        failure = new BigQueryError(
          timeout.aborted ? 'BigQuery API request timed out' : `BigQuery API request failed: ${errorText(error)}`
        );
      }

      const delay = Math.min(250 * 2 ** (attempt - 1), 4_000) + Math.random() * 100;
      if (!retryable(failure) || attempt >= MAX_ATTEMPTS || Date.now() + delay >= deadline) throw failure;
      await sleep(delay, undefined, { signal: options.signal });
    }
  }

  getDataset({ projectId, datasetId }: DatasetReference): Promise<{ location?: string }> {
    return this.request('GET', `projects/${segment(projectId)}/datasets/${segment(datasetId)}`);
  }

  async listTables({ projectId, datasetId }: DatasetReference): Promise<TableListItem[]> {
    const tables: TableListItem[] = [];
    let pageToken: string | undefined;
    do {
      const page = await this.request<{ tables?: TableListItem[]; nextPageToken?: string }>(
        'GET',
        `projects/${segment(projectId)}/datasets/${segment(datasetId)}/tables`,
        { query: { maxResults: 1000, pageToken } }
      );
      tables.push(...(page.tables ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return tables;
  }

  getTable({ projectId, datasetId, tableId }: TableReference): Promise<Table> {
    return this.request(
      'GET',
      `projects/${segment(projectId)}/datasets/${segment(datasetId)}/tables/${segment(tableId)}`,
      // BASIC returns schema and constraints without storage statistics.
      { query: { view: 'BASIC' } }
    );
  }

  query(
    projectId: string,
    body: QueryRequest,
    options: Pick<RequestOptions, 'deadline' | 'signal'> = {}
  ): Promise<QueryResults> {
    return this.request('POST', `projects/${segment(projectId)}/queries`, { ...options, body });
  }

  getQueryResults(
    job: JobReference,
    query: { maxResults?: number; pageToken?: string; timeoutMs?: number },
    options: Pick<RequestOptions, 'deadline' | 'signal'> = {}
  ): Promise<QueryResults> {
    return this.request('GET', `projects/${segment(job.projectId)}/queries/${segment(job.jobId)}`, {
      ...options,
      query: { ...query, location: job.location, 'formatOptions.useInt64Timestamp': true },
    });
  }

  async cancel(job: JobReference): Promise<void> {
    await this.request('POST', `projects/${segment(job.projectId)}/jobs/${segment(job.jobId)}/cancel`, {
      query: { location: job.location },
    });
  }
}
