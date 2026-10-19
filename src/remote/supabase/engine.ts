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
  DataContext,
  DataSourceConfig,
  LLMConfig,
  Schema,
  ExecutionOptions,
  ExecutionResult,
} from '../../types';

const SUPABASE_API_BASE = 'https://api.supabase.com';
const REQUEST_TIMEOUT_MS = 30_000;

type SupabaseApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'bad_query'
  | 'server_error'
  | 'timeout'
  | 'network'
  | 'unknown';

function getSqlState(detail: unknown): string | undefined {
  if (!detail || typeof detail !== 'object') return undefined;
  const code = (detail as Record<string, unknown>).code;
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? code : undefined;
}

function classifyHttpError(status: number, detail: unknown): SupabaseApiErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  // A gateway timeout is actionable like a client-side timeout, and both are retryable.
  if (status === 408 || status === 504) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'bad_query';
  if (status >= 500 && status < 600) return 'server_error';

  // Use SQLSTATE only when HTTP status does not already provide an actionable category.
  const sqlState = getSqlState(detail);
  if (sqlState?.startsWith('08')) return 'network';
  if (sqlState?.startsWith('22') || sqlState?.startsWith('23') || sqlState?.startsWith('42')) return 'bad_query';
  if (sqlState === '57014') return 'timeout';
  return 'unknown';
}

export class SupabaseApiError extends Error {
  constructor(message: string, status: number, code: SupabaseApiErrorCode, detail?: unknown) {
    super(message);
    this.name = 'SupabaseApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.retryable = code === 'timeout' || code === 'network' || code === 'rate_limited' || code === 'server_error';
  }
  readonly status: number;
  readonly code: SupabaseApiErrorCode;
  /** Full upstream response payload, retained for diagnosis; it may contain sensitive SQL or schema details. */
  readonly detail: unknown;
  readonly retryable: boolean;
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

  async getDSL(query: string, context: DataContext): Promise<string> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return this.queryDialect.getDSL(query, context);
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
        const responseText = await response.text().catch(() => '');
        let detail: unknown = responseText;
        try {
          detail = JSON.parse(responseText);
        } catch {
          // Keep non-JSON response bodies intact.
        }
        const code = classifyHttpError(response.status, detail);
        throw new SupabaseApiError(
          `Supabase API request failed (${response.status})`,
          response.status,
          code,
          detail
        );
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new SupabaseApiError('Supabase API returned an invalid JSON response', response.status, 'unknown', error);
        }
        throw error;
      }
      return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
    } catch (error) {
      const isTimeout = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
      if (!isTimeout && error instanceof SupabaseApiError) throw error;
      throw new SupabaseApiError(
        isTimeout ? 'Supabase API request timed out' : 'Supabase API network error',
        0,
        isTimeout ? 'timeout' : 'network',
        error
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
