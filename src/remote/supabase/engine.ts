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
  DataModel,
  DataSourceConfig,
  LLMConfig,
  Schema,
  ExecutionOptions,
  ExecutionResult,
} from '../../types';

const SUPABASE_API_BASE = 'https://api.supabase.com';
const REQUEST_TIMEOUT_MS = 30_000;

export class SupabaseApiError extends Error {
  constructor(status: number, detail: string) {
    super(`Supabase API request failed (${status})`);
    this.name = 'SupabaseApiError';
    this.status = status;
    this.detail = detail;
  }
  readonly status: number;
  readonly detail: string;
}

export class SupabaseEngine implements AnalysisEngine {
  readonly language = {
    name: 'PostgreSQL SQL dialect',
    fence: 'sql',
  };

  private connection: { accessToken: string; projectRef: string } | null = null;
  private readonly queryDialect: PostgreSQLQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new PostgreSQLQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<void> {
    this.connection = null;
    if (config.type !== 'supabase') {
      throw new Error(`SupabaseEngine only supports 'supabase' data sources, got '${config.type}'`);
    }
    this.connection = config.options;
  }

  async schema(): Promise<Schema> {
    if (!this.connection) throw new Error('No data loaded. Please call source() first.');
    return getSupabaseSchema((sql) => this.runQuery(sql));
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.connection) throw new Error('No data loaded. Please call source() first.');
    return profileTables(
      (sql) => this.runQuery(sql),
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel): Promise<string> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return this.queryDialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(sql: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }
    const query = await this.queryDialect.validateDSL(sql);
    const rows = (await this.runQuery(limitedQuery(query, maxRows(options)))) as T[];
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.connection = null;
  }

  /**
   * Execute a read-only SQL query through the Management API and return the
   * result rows.
   */
  private async runQuery(sql: string): Promise<Record<string, unknown>[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
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

      if (!response.ok) {
        throw new SupabaseApiError(response.status, await response.text());
      }

      const payload = (await response.json()) as unknown;
      return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
    } finally {
      clearTimeout(timer);
    }
  }
}
