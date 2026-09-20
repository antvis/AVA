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
import { mapFieldType } from '../util/schema';
import { sqlStringLiteral } from '../util/sql';

import type {
  AnalysisEngine,
  DataSourceConfig,
  FieldMetadata,
  LLMConfig,
  Schema,
  TableSchema,
} from '../types';

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
    this.schema = await this.discoverSchema();
    return this.schema;
  }

  async getDSL(query: string): Promise<string> {
    if (!this.schema) {
      throw new Error('No data loaded. Please call load() first.');
    }
    return this.queryDialect.getDSL(query, this.schema);
  }

  async execute(sql: string): Promise<any> {
    if (!this.connection) {
      throw new Error('No data loaded. Please call load() first.');
    }
    await this.queryDialect.validateDSL(sql);
    return this.runQuery(sql);
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
        `${SUPABASE_API_BASE}/v1/projects/${encodeURIComponent(
          this.connection!.projectRef
        )}/database/query`,
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
      throw new SupabaseApiError(
        `Supabase API request failed (${response.status}): ${detail}`,
        response.status
      );
    }

    const payload = (await response.json()) as unknown;
    return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
  }

  /**
   * Discover every BASE TABLE in the public schema (columns plus a row-count
   * estimate from pg_class.reltuples) — one SQL round trip, no data materialized.
   */
  private async discoverSchema(): Promise<Schema> {
    const rows = await this.runQuery(
      `
SELECT t.table_name,
       c.column_name, c.data_type, c.ordinal_position,
       cls.reltuples
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = t.table_schema AND c.table_name = t.table_name
LEFT JOIN pg_class cls
  ON cls.relnamespace = ${sqlStringLiteral(SUPABASE_SCHEMA)}::regnamespace
 AND cls.relname = t.table_name
WHERE t.table_schema = ${sqlStringLiteral(SUPABASE_SCHEMA)}
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position
`
    );

    const tables = new Map<string, { fields: FieldMetadata[]; rowCount: number }>();
    for (const row of rows) {
      const tableName = String(row.table_name ?? '');
      if (!tableName) continue;

      if (!tables.has(tableName)) {
        const reltuples = Number(row.reltuples);
        tables.set(tableName, {
          fields: [],
          rowCount: Number.isFinite(reltuples) && reltuples >= 0 ? Math.round(reltuples) : 0,
        });
    }
      const table = tables.get(tableName)!;
      if (typeof row.column_name === 'string' && row.column_name) {
        const dataType = String(row.data_type ?? '');
        table.fields.push({
          name: row.column_name,
          type: mapFieldType(dataType),
          rawType: dataType,
        });
      }
    }

    const result: TableSchema[] = [...tables.entries()].map(([name, t]) => ({
      name,
      rowCount: t.rowCount,
      columnCount: t.fields.length,
      fields: t.fields,
    }));
    return { tables: result };
  }
}
