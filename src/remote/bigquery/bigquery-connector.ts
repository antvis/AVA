/**
 * BigQuery connector built on the `@google-cloud/bigquery` client. Statements
 * always run through a query job configured with the source options. Because
 * the service account may still own write privileges, BigQueryEngine
 * additionally validates each statement as a single read-only SELECT before it
 * reaches this connector.
 *
 * The @google-cloud/bigquery package is loaded lazily via `require()` so this
 * module type-checks and is exercised by tests even where the bindings are
 * optional; tests stub the module with `vi.mock`.
 */
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

interface BigQueryQueryJobResult {
  [0]: BigQueryRow[];
  [1]: unknown;
  [2]?: BigQuerySchemaField[];
}

interface BigQueryCreateQueryJobOptions {
  query: string;
  location?: string;
  maxResults?: number;
  useLegacySql: boolean;
  maximumBytesBilled?: number;
}

interface BigQueryClient {
  createQueryJob(options: BigQueryCreateQueryJobOptions): Promise<[unknown, BigQueryQueryJobResult]>;
}

interface BigQueryModule {
  BigQuery: new (config: unknown) => BigQueryClient;
}

let cachedModule: BigQueryModule | null | undefined;

/** Load (and cache) the @google-cloud/bigquery bindings, throwing a clear error when absent. */
function loadBigQuery(): BigQueryModule {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require('@google-cloud/bigquery') as BigQueryModule;
  } catch {
    throw new Error(
      'BigQuery adapter requires the optional "@google-cloud/bigquery" dependency. ' +
        'Install it (npm i @google-cloud/bigquery) or set adapter: "mock" to use the in-memory connector.'
    );
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

export class BigQueryQueryConnector implements QueryConnector {
  private readonly options: BigQuerySourceOptions;
  private client: BigQueryClient | null = null;

  constructor(options: BigQuerySourceOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.client) return;
    const { BigQuery } = loadBigQuery();
    const credentials = normalizeCredentials(this.options);
    this.client = new BigQuery({
      projectId: this.options.projectId,
      ...(credentials !== undefined ? { credentials } : {}),
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    const client = this.client!;
    const [, rowsResponse] = await client.createQueryJob({
      query: sql,
      location: this.options.location,
      maxResults: this.options.defaultRowLimit,
      useLegacySql: false,
      ...(this.options.maxBytesBilled !== undefined
        ? { maximumBytesBilled: this.options.maxBytesBilled }
        : {}),
    });

    const response = await Promise.resolve(rowsResponse);
    const responseArray = response as unknown as {
      [0]?: BigQueryRow[];
      [2]?: BigQuerySchemaField[];
    };
    const rows = responseArray[0] ?? [];
    const schema = responseArray[2];

    const columns: QueryColumnMeta[] = (schema ?? []).map((field) => ({
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