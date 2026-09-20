/**
 * DuckDB engine: LLM generates SQL, executed against an in-memory DuckDB instance.
 */

import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DuckDBInstance } from '@duckdb/node-api';

import { DuckDBQueryDialect } from '../query/duckdb';
import { coerceNumbers } from '../util/coerce';
import { mapFieldType } from '../util/schema';
import { sqlIdentifier, sqlStringLiteral } from '../util/sql';

import { loadSource } from './loaders';

import type { DuckDBConnection } from '@duckdb/node-api';
import type {
  AnalysisEngine,
  DataSourceConfig,
  DuckDBEngineOptions,
  Schema,
  TableSchema,
  FieldMetadata,
  LLMConfig,
} from '../types';

/**
 * Process-level security baseline: DuckDB extensions run with the same
 * privileges as the host process, so disable auto-install/auto-load and
 * non-official extensions at instance creation. The mysql/postgres loaders
 * still work because those extensions are statically linked (built-in), so
 * an explicit `LOAD mysql`/`LOAD postgres` is unaffected by these flags.
 * https://duckdb.org/docs/current/operations_manual/securing_duckdb/securing_extensions
 */
const EXTENSION_LOCKDOWN = {
  allow_community_extensions: 'false',
  allow_unsigned_extensions: 'false',
  autoinstall_known_extensions: 'false',
  autoload_known_extensions: 'false',
} as const;

/** Defaults keep a runaway LLM-generated query from exhausting the host. */
const DEFAULT_MEMORY_LIMIT = '512MB';
const DEFAULT_THREADS = 1;
const DEFAULT_QUERY_TIMEOUT_MS = 30_000;

/** Thrown when a query exceeds the configured timeout. */
export class QueryTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`DuckDB query timed out after ${timeoutMs}ms`);
    this.name = 'QueryTimeoutError';
  }
}

export class DuckDBEngine implements AnalysisEngine {
  private instance: DuckDBInstance | null = null;
  private connection: DuckDBConnection | null = null;
  /** Names of all views registered by the loaded source (one per table) */
  private tableNames: string[] = [];
  private cleanup: (() => Promise<void>) | null = null;
  private readonly queryDialect: DuckDBQueryDialect;

  constructor(
    private readonly llmConfig: LLMConfig,
    private readonly engineOptions: DuckDBEngineOptions = {},
  ) {
    this.queryDialect = new DuckDBQueryDialect(llmConfig);
  }

  /**
   * Get or create the DuckDB connection (lazy loading)
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (this.connection) return this.connection;

    this.instance = await DuckDBInstance.create(':memory:', { ...EXTENSION_LOCKDOWN });
    this.connection = await this.instance.connect();
    return this.connection;
  }

  /**
   * Harden the session after the data view is registered: whitelist the data
   * file's directories, then disable further external access and lock the
   * configuration so LLM-generated SQL cannot read arbitrary files or undo it.
   */
  private async restrictAccess(conn: DuckDBConnection, allowedDirectories: string[]): Promise<void> {
    // Resource limits must be set before lock_configuration (which freezes all
    // settings). They bound a runaway LLM-generated query's memory/CPU/disk.
    await conn.run(`SET memory_limit = ${sqlStringLiteral(this.engineOptions.memoryLimit ?? DEFAULT_MEMORY_LIMIT)}`);
    await conn.run(`SET threads = ${this.engineOptions.threads ?? DEFAULT_THREADS}`);
    if (this.engineOptions.maxTempDirectorySize) {
      await conn.run(`SET max_temp_directory_size = ${sqlStringLiteral(this.engineOptions.maxTempDirectorySize)}`);
    }
    if (allowedDirectories.length > 0) {
      await conn.run(`SET allowed_directories = [${allowedDirectories.map(sqlStringLiteral).join(', ')}]`);
    }
    // Confine spill files (from out-of-memory sorts/joins) to a known directory
    // instead of the default `.tmp` in the process working directory.
    const tempBase = allowedDirectories[0] ?? tmpdir();
    await conn.run(`SET temp_directory = ${sqlStringLiteral(join(tempBase, '.dbtmp'))}`);
    // en Postgres catalog, external access must be disabled before disabling the local filesystem; configuration lock must be set last.
    // The data view is already registered, so external access is no longer needed.
    await conn.run('SET enable_external_access = false');
    if (allowedDirectories.length === 0) {
      // No local data file to read — disable the local filesystem entirely.
      await conn.run("SET disabled_filesystems = 'LocalFileSystem'");
    }
    // Lock last so the settings above cannot be changed again.
    await conn.run('SET lock_configuration = true');
  }

  async load(config: DataSourceConfig): Promise<Schema> {
    try {
      const source = await loadSource(config, this.llmConfig);
      const conn = await this.getConnection();
      this.tableNames = await source.register(conn);
      await this.restrictAccess(conn, source.allowedDirectories);
      this.cleanup = source.cleanup;
    } catch (error) {
      await this.cleanup?.();
      this.cleanup = null;
      this.close();
      throw error;
    }

    return this.getSchema();
  }

  async getDSL(query: string): Promise<string> {
    return this.queryDialect.getDSL(query, await this.getSchema());
  }

  async execute(sql: string): Promise<any> {
    const conn = await this.getConnection();
    await this.queryDialect.validateDSL(sql, conn);
    const reader = await this.runWithTimeout(conn, conn.runAndReadAll(sql));
    return coerceNumbers(reader.getRowObjectsJson());
  }

  /**
   * Race a query against the configured timeout. On timeout, interrupt the
   * connection (cancels the running query) and reject with QueryTimeoutError,
   * so a slow/pathological LLM-generated query cannot hang the session.
   */
  private async runWithTimeout<T>(conn: DuckDBConnection, operation: Promise<T>): Promise<T> {
    const timeoutMs = this.engineOptions.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
    if (timeoutMs <= 0) return operation;

    const timeoutMarker = Symbol('duckdb-query-timeout');
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        operation,
        new Promise<typeof timeoutMarker>((resolve) => {
          timeoutId = setTimeout(() => resolve(timeoutMarker), timeoutMs);
          // Don't keep the process alive solely for this timer.
          timeoutId.unref?.();
        }),
      ]);
      if (result === timeoutMarker) {
        conn.interrupt();
        // Swallow the interrupted query's rejection so it isn't unhandled.
        void operation.catch(() => undefined);
        throw new QueryTimeoutError(timeoutMs);
      }
      return result;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Derive the dataset schema from DuckDB without materializing the data:
   * one TableSchema per registered view. Categorical fields get distinct
   * values; numeric/temporal fields get min/max.
   */
  private async getSchema(): Promise<Schema> {
    const conn = await this.getConnection();
    const tables: TableSchema[] = [];
    for (const name of this.tableNames) {
      tables.push(await this.getTableSchema(conn, name));
    }
    return { tables };
  }

  /**
   * Profile a single view: row count plus per-column stats.
   */
  private async getTableSchema(conn: DuckDBConnection, tableName: string): Promise<TableSchema> {
    const colsReader = await conn.runAndReadAll(`DESCRIBE ${sqlIdentifier(tableName)}`);
    const cols = colsReader.getRowObjectsJson();

    // One aggregate query computes row count plus per-column stats
    const MAX_DISTINCT = 20;
    const stats = cols.map((col: any, i: number) => {
      const name = sqlIdentifier(String(col.column_name));
      const type = mapFieldType(String(col.column_type));
      if (type === 'string' || type === 'boolean') {
        return `struct_pack(distinct_count := COUNT(DISTINCT ${name}), items := COALESCE(min(DISTINCT ${name}, ${MAX_DISTINCT}), [])) AS "s${i}"`;
      }
      const finite = /DOUBLE|FLOAT|REAL/i.test(String(col.column_type)) ? ` FILTER (WHERE isfinite(${name}))` : '';
      // Numbers stay numeric; temporal columns become epoch milliseconds
      const minExpr = type === 'date' ? `epoch_ms(min(${name}))` : `min(${name})${finite}`;
      const maxExpr = type === 'date' ? `epoch_ms(max(${name}))` : `max(${name})${finite}`;
      return `struct_pack(min := ${minExpr}, max := ${maxExpr}) AS "s${i}"`;
    });
    const profileSql = `SELECT COUNT(*) AS "__rows", ${stats.join(', ')} FROM ${sqlIdentifier(tableName)}`;
    const profileRow = (await conn.runAndReadAll(profileSql)).getRowObjectsJson()[0] as any;

    const fields: FieldMetadata[] = cols.map((col: any, i: number) => {
      const rawType = String(col.column_type);
      const type = mapFieldType(rawType);
      const stat = profileRow[`s${i}`] as any;
      const field: FieldMetadata = { name: col.column_name, type, rawType };
      if (type === 'string' || type === 'boolean') {
        field.uniqueCount = Number(stat?.distinct_count ?? 0);
        field.samples = (stat?.items ?? []) as any[];
      } else {
        // BIGINT/DECIMAL/epoch_ms come back as strings — coerce to numbers
        field.min = stat?.min == null ? undefined : Number(stat.min);
        field.max = stat?.max == null ? undefined : Number(stat.max);
      }
      return field;
    });

    return {
      name: tableName,
      rowCount: Number(profileRow?.__rows ?? 0),
      columnCount: fields.length,
      fields,
    };
  }

  /**
   * Close the database connection and instance
   */
  private close(): void {
    try {
      this.connection?.closeSync();
      this.instance?.closeSync();
    } catch {
      // already closed
    }
    this.connection = null;
    this.instance = null;
  }

  async dispose(): Promise<void> {
    this.close();
    await this.cleanup?.();
    this.cleanup = null;
  }
}
