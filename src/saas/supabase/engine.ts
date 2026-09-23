/**
 * Supabase engine: LLM generates SQL, executed remotely through the Supabase
 * Management API (POST https://api.supabase.com/v1/projects/:ref/database/query).
 * Unlike DuckDBEngine, no data is materialized locally — the query endpoint
 * applies the read-only `supabase_read_only_user` role (read_only: true), so
 * LLM-generated SQL can never write to the project. The OAuth handshake
 * (authorize/token exchange/refresh) is out of scope: the consuming app
 * obtains the access token and passes it in the data source config.
 */

import { PostgreSQLQueryDialect } from '../../query/postgresql';
import { executionResult, inferQuerySchema, limitedQuery, maxRows } from '../../util/result';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';

import { profileTables } from './profile';
import { getSupabaseSchema } from './schema';

import type {
  Profile,
  ProfileOptions,
  AnalysisEngine,
  DataSourceConfig,
  LLMConfig,
  Schema,
  ExecutionOptions,
  ExecutionResult,
} from '../../types';

const SUPABASE_API_BASE = 'https://api.supabase.com';
const REQUEST_TIMEOUT_MS = 30_000;

export class SupabaseApiError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SupabaseApiError';
    this.status = status;
  }
  readonly status: number;
}

export class SupabaseEngine implements AnalysisEngine {
  readonly language = {
    name: 'PostgreSQL SQL dialect',
    fence: 'sql',
  };

  private schema: Schema | null = null;
  private connection: { accessToken: string; projectRef: string } | null = null;
  private readonly queryDialect: PostgreSQLQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new PostgreSQLQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<Schema> {
    this.schema = null;
    this.connection = null;
    if (config.type !== 'supabase') {
      throw new Error(`SupabaseEngine only supports 'supabase' data sources, got '${config.type}'`);
    }
    this.connection = config.options;
    try {
      this.schema = await getSupabaseSchema((sql) => this.runQuery(sql));
    } catch (error) {
      this.connection = null;
      throw error;
    }
    return this.schema;
  }

  async profile(options: ProfileOptions = {}): Promise<Profile> {
    if (!this.schema || !this.connection) throw new Error('No data loaded. Please call load() first.');
    return profileTables(
      (sql) => this.runQuery(sql),
      this.schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string): Promise<string> {
    if (!this.schema) {
      throw new Error('No data loaded. Please call load() first.');
    }
    return this.queryDialect.getDSL(query, this.schema);
  }

  async execute<T = Record<string, unknown>>(sql: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call load() first.');
    }
    await this.queryDialect.validateDSL(sql);
    const rows = (await this.runQuery(limitedQuery(sql, maxRows(options)))) as T[];
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.schema = null;
    this.connection = null;
  }

  /**
   * Execute a read-only SQL query through the Management API and return the
   * result rows.
   */
  private async runQuery(sql: string): Promise<Record<string, unknown>[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        `${SUPABASE_API_BASE}/v1/projects/${encodeURIComponent(this.connection!.projectRef)}/database/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.connection!.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql, read_only: true }),
          signal: controller.signal,
        }
      );
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      throw new SupabaseApiError(isTimeout ? 'Supabase API request timed out' : 'Supabase API network error', 0);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 200);
      throw new SupabaseApiError(`Supabase API request failed (${response.status}): ${detail}`, response.status);
    }

    const payload = (await response.json()) as unknown;
    return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
  }
}
