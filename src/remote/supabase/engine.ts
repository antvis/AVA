/**
 * Supabase engine: LLM generates SQL, executed remotely through the Supabase
 * Management API (POST https://api.supabase.com/v1/projects/:ref/database/query).
 * Unlike DuckDBEngine, no data is materialized locally — the query endpoint
 * applies the read-only `supabase_read_only_user` role (read_only: true), so
 * LLM-generated SQL can never write to the project. The OAuth handshake
 * (authorize/token exchange/refresh) is out of scope: the consuming app
 * obtains the access token and passes it in the data source config.
 */

import { PostgreSQLDialect } from '../../query/postgresql';
import { executionResult, inferQuerySchema, limitedQuery, maxRows } from '../../util/result';
import { throwIfAborted } from '../../util/abort';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';

import { profileTables } from './profile';
import { getSupabaseSchema } from './schema';

import type {
  TranslationResult,
  Profile,
  ProfileOptions,
  DataModel,
  DataSourceConfig,
  Schema,
  ExecutionOptions,
  ExecutionResult,
  AnalysisEngine,
  LLMConfig,
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
  private connection: { accessToken: string; projectRef: string } | null = null;
  readonly dialect: PostgreSQLDialect;

  constructor(llmConfig: LLMConfig) {
    this.dialect = new PostgreSQLDialect(llmConfig);
  }

  async load(configs: DataSourceConfig | DataSourceConfig[]): Promise<void> {
    const sources = Array.isArray(configs) ? configs : [configs];
    if (sources.length !== 1) {
      throw new Error(`SupabaseEngine currently supports exactly one data source, received ${sources.length}`);
    }
    const config = sources[0];
    this.connection = null;
    if (config.type !== 'supabase') {
      throw new Error(`SupabaseEngine only supports 'supabase' data sources, got '${config.type}'`);
    }
    this.connection = config.options;
  }

  async schema(signal?: AbortSignal): Promise<Schema> {
    if (!this.connection) throw new Error('No data loaded. Please call source() first.');
    return getSupabaseSchema((sql) => this.runQuery(sql, signal));
  }

  async profile(schema: Schema, options: ProfileOptions = {}, signal?: AbortSignal): Promise<Profile> {
    if (!this.connection) throw new Error('No data loaded. Please call source() first.');
    throwIfAborted(signal);
    return profileTables(
      (sql) => this.runQuery(sql, signal),
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel, signal?: AbortSignal): Promise<TranslationResult> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return signal ? this.dialect.getDSL(query, dataModel, signal) : this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(
    sql: string,
    options?: ExecutionOptions,
    signal?: AbortSignal
  ): Promise<ExecutionResult<T>> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }
    throwIfAborted(signal);
    const query = await this.dialect.validateDSL(sql);
    const rows = (await this.runQuery(limitedQuery(query, maxRows(options)), signal)) as T[];
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.connection = null;
  }

  /**
   * Execute a read-only SQL query through the Management API and return the
   * result rows.
   */
  private async runQuery(sql: string, signal?: AbortSignal): Promise<Record<string, unknown>[]> {
    if (!this.connection) throw new Error('No data loaded. Please call source() first.');
    throwIfAborted(signal);
    const controller = new AbortController();
    const requestSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${SUPABASE_API_BASE}/v1/projects/${encodeURIComponent(this.connection.projectRef)}/database/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.connection.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql, read_only: true }),
          signal: requestSignal,
        }
      );

      if (!response.ok) {
        throw new SupabaseApiError(response.status, await response.text());
      }

      const payload = (await response.json()) as unknown;
      throwIfAborted(requestSignal);
      return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
    } catch (error) {
      throwIfAborted(signal);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
