/**
 * BigQuery connector built on the `@google-cloud/bigquery` client. Statements
 * always run through a query job configured with the source options. Because
 * the service account may still own write privileges, BigQueryEngine
 * additionally validates each statement as a single read-only SELECT before it
 * reaches this connector.
 *
 * The optional driver is loaded through a deferred dynamic import so both the
 * CommonJS and ESM published builds can load it without a bare `require()`.
 */
import { runWithTimeout } from '../../util/timeout';

import type { BigQuerySourceOptions } from '../../types';
import type { QueryColumnMeta, QueryConnector, QueryResult, QueryResultRow } from './connector';

/** Structural subset of the BigQuery JS client surface used here. */
interface BigQuerySchemaField {
  name: string;
  type: string;
  mode?: string;
}

interface BigQueryRow {
  [name: string]: unknown;
}

interface BigQueryQueryResultsMetadata {
  schema?: {
    fields?: BigQuerySchemaField[];
  };
}

type BigQueryQueryResults = [BigQueryRow[], unknown, BigQueryQueryResultsMetadata?];

interface BigQueryJob {
  getQueryResults(): Promise<BigQueryQueryResults>;
  cancel(): Promise<unknown>;
}

interface BigQueryCreateQueryJobOptions {
  query: string;
  location?: string;
  maxResults?: number;
  useLegacySql: boolean;
  maximumBytesBilled?: number;
  defaultDataset?: {
    projectId: string;
    datasetId: string;
  };
}

interface BigQueryClient {
  createQueryJob(options: BigQueryCreateQueryJobOptions): Promise<[BigQueryJob, unknown]>;
}

interface BigQueryModule {
  BigQuery: new (config: unknown) => BigQueryClient;
}

const DRIVER_MODULE = '@google-cloud/bigquery';
const DEFAULT_TIMEOUT_MS = 60000;
let cachedModule: Promise<BigQueryModule> | undefined;

/** Load (and cache) the @google-cloud/bigquery bindings, throwing a clear error when absent. */
async function loadBigQuery(): Promise<BigQueryModule> {
  if (!cachedModule) {
    cachedModule = import(DRIVER_MODULE)
      .then((loaded) => {
        const module = loaded as BigQueryModule & { default?: BigQueryModule };
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
      try {
        return JSON.parse(credentials) as Record<string, unknown>;
      } catch {
        return { client_email: credentials, private_key: '' };
      }
    }
    return credentials;
  }
  if (clientEmail && privateKey) {
    return { client_email: clientEmail, private_key: privateKey };
  }
  return undefined;
}

/** Best-effort cancellation; the timeout error remains the primary failure. */
function cancelJob(job: BigQueryJob): void {
  try {
    void job.cancel().catch(() => undefined);
  } catch {
    // A synchronously failing cancellation must not mask the query timeout.
  }
}

export class BigQueryQueryConnector implements QueryConnector {
  private readonly options: BigQuerySourceOptions;
  private client: BigQueryClient | null = null;

  constructor(options: BigQuerySourceOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.client) return;
    const { BigQuery } = await loadBigQuery();
    const credentials = normalizeCredentials(this.options);
    this.client = new BigQuery({
      projectId: this.options.projectId,
      ...(credentials !== undefined ? { credentials } : {}),
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    const client = this.client!;
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let job: BigQueryJob | undefined;
    let timedOut = false;

    const operation = (async (): Promise<BigQueryQueryResults> => {
      const [createdJob] = await client.createQueryJob({
        query: sql,
        location: this.options.location,
        maxResults: this.options.defaultRowLimit,
        useLegacySql: false,
        ...(this.options.maxBytesBilled !== undefined
          ? { maximumBytesBilled: this.options.maxBytesBilled }
          : {}),
        ...(this.options.dataset
          ? { defaultDataset: { projectId: this.options.projectId, datasetId: this.options.dataset } }
          : {}),
      });
      job = createdJob;
      if (timedOut) cancelJob(createdJob);
      return createdJob.getQueryResults();
    })();

    const response = await runWithTimeout(operation, timeoutMs, {
      onTimeout: () => {
        timedOut = true;
        if (job) cancelJob(job);
        return new Error(`BigQuery query timed out after ${timeoutMs}ms; job cancellation was requested`);
      },
      unref: true,
    });

    const rows = response[0] ?? [];
    const columns: QueryColumnMeta[] = (response[2]?.schema?.fields ?? []).map((field) => ({
      name: field.name,
      type: field.type,
    }));

    return { columns, rows: rows as T[] };
  }

  async close(): Promise<void> {
    this.client = null;
  }
}

// Re-export for tests that need to construct the connector.
export { loadBigQuery, normalizeCredentials };
