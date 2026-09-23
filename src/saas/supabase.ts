/**
 * Supabase engine: LLM generates SQL, executed remotely through the Supabase
 * Management API (POST https://api.supabase.com/v1/projects/:ref/database/query).
 * Unlike DuckDBEngine, no data is materialized locally — the query endpoint
 * applies the read-only `supabase_read_only_user` role (read_only: true), so
 * LLM-generated SQL can never write to the project. The OAuth handshake
 * (authorize/token exchange/refresh) is out of scope: the consuming app
 * obtains the access token and passes it in the data source config.
 */

import { PostgreSQLQueryDialect } from '../query/postgresql';
import { executionResult, inferQuerySchema, limitedQuery, maxRows } from '../util/result';
import { rowObjects2Schema } from '../util/schema';
import { sqlStringLiteral, sqlUnionAll } from '../util/sql';

import type { AnalysisEngine, DataSourceConfig, LLMConfig, Schema, ExecutionOptions, ExecutionResult } from '../types';

/** Restrict all branches to readable relations in the requested schema. */
function exposedSQL(schema: string): string {
  return `
SELECT t.oid, t.relname
FROM pg_catalog.pg_class t
JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = ${sqlStringLiteral(schema)}
  AND t.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND has_table_privilege(t.oid, 'SELECT')`.trim();
}

function tablesSQL(): string {
  return `
SELECT
  'table' AS kind,
  relname AS table_name,
  '{}'::text AS metadata
FROM exposed`.trim();
}

/** Preserve native types and column order; exclude dropped/system columns. */
function columnsSQL(): string {
  return `
SELECT
  'column' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', a.attname,
    'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
    'nullable', NOT a.attnotnull,
    'position', a.attnum
  )::text AS metadata
FROM exposed t
JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid
WHERE a.attnum > 0 AND NOT a.attisdropped`.trim();
}

/** Preserve index DDL and primary/unique flags. */
function indexesSQL(): string {
  return `
SELECT
  'index' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', ic.relname,
    'unique', i.indisunique,
    'primary', i.indisprimary,
    'definition', pg_catalog.pg_get_indexdef(i.indexrelid)
  )::text AS metadata
FROM exposed t
JOIN pg_catalog.pg_index i ON i.indrelid = t.oid
JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid`.trim();
}

/** Pair composite FK columns by position; both tables must be exposed. */
function foreignKeysSQL(): string {
  return `
SELECT
  'foreign-key-column' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', c.conname,
    'column', a.attname,
    'referencedTable', rt.relname,
    'referencedColumn', ra.attname,
    'position', k.ordinality
  )::text AS metadata
FROM pg_catalog.pg_constraint c
JOIN exposed t ON t.oid = c.conrelid
JOIN exposed rt ON rt.oid = c.confrelid
CROSS JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS k(local_attnum, remote_attnum, ordinality)
JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.local_attnum
JOIN pg_catalog.pg_attribute ra ON ra.attrelid = rt.oid AND ra.attnum = k.remote_attnum
WHERE c.contype = 'f'`.trim();
}

const SUPABASE_API_BASE = 'https://api.supabase.com';
const REQUEST_TIMEOUT_MS = 30_000;
/** Only the public schema is read — Supabase user tables live there by default. */
const SUPABASE_SCHEMA = 'public';

export class SupabaseApiError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SupabaseApiError';
    this.status = status;
  }
  readonly status: number;
}

export class SupabaseEngine implements AnalysisEngine {
  private schema: Schema | null = null;
  private connection: { accessToken: string; projectRef: string } | null = null;
  private readonly queryDialect: PostgreSQLQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new PostgreSQLQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<Schema> {
    if (config.type !== 'supabase') {
      throw new Error(`SupabaseEngine only supports 'supabase' data sources, got '${config.type}'`);
    }
    this.connection = config.options;
    this.schema = await this.getSchema();
    return this.schema;
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

  /** Stateless — nothing to release. */
  async dispose(): Promise<void> {}

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

  /** One read-only catalog query for fields, indexes and foreign keys. */
  private async getSchema(): Promise<Schema> {
    const sql = `WITH exposed AS (\n${exposedSQL(SUPABASE_SCHEMA)}\n)\n${sqlUnionAll([
      tablesSQL(),
      columnsSQL(),
      indexesSQL(),
      foreignKeysSQL(),
    ])}`;

    const rows = await this.runQuery(sql);
    return rowObjects2Schema(rows);
  }
}
