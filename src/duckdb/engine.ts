/**
 * DuckDB engine: LLM generates SQL, executed against an in-memory DuckDB instance.
 */

import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DuckDBInstance } from '@duckdb/node-api';

import { DuckDBQueryDialect } from '../query/duckdb';
import { executionResult, limitedQuery, maxRows } from '../util/result';
import { coerceNumbers } from '../util/coerce';
import { sqlStringLiteral } from '../util/sql';

import { loadSource } from './loaders';

import type { DuckDBConnection } from '@duckdb/node-api';
import type {
  AnalysisEngine,
  DataSourceConfig,
  DuckDBEngineOptions,
  Schema,
  TableSchema,
  TableIndex,
  LLMConfig,
  ExecutionOptions,
  ExecutionResult,
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

  constructor(private readonly llmConfig: LLMConfig, private readonly engineOptions: DuckDBEngineOptions = {}) {
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

  async execute<T = Record<string, unknown>>(sql: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    const conn = await this.getConnection();
    await this.queryDialect.validateDSL(sql, conn);
    const reader = await this.runWithTimeout(conn, conn.runAndReadAll(limitedQuery(sql, maxRows(options))));
    const schema = Array.from({ length: reader.columnCount }, (_, index) => ({
      name: reader.columnName(index),
      type: reader.columnType(index).toString(),
    }));
    return executionResult(coerceNumbers(reader.getRowObjectsJson()) as T[], schema, options);
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
   * Read column metadata and indexes for all registered views in catalog
   * queries: `duckdb_columns()` for columns; `duckdb_constraints()` and
   * `duckdb_indexes()` for constraints and secondary indexes.
   * File-based sources simply have no constraint/index rows.
   */
  private async getSchema(): Promise<Schema> {
    const conn = await this.getConnection();
    const nameList = this.tableNames.map(sqlStringLiteral).join(', ');
    const tableSet = new Set(this.tableNames);

    // One query for all columns across every registered table.
    const colReader = await conn.runAndReadAll(
      `SELECT table_name, column_name, data_type, is_nullable
         FROM duckdb_columns()
        WHERE table_name IN (${nameList})
        ORDER BY table_name, column_index`
    );
    const columnsByTable = new Map<string, FieldMetadata[]>();
    for (const row of colReader.getRowObjectsJson()) {
      const tableName = String(row.table_name);
      if (!tableSet.has(tableName)) continue;
      (columnsByTable.get(tableName) ?? columnsByTable.set(tableName, []).get(tableName)!).push({
        name: String(row.column_name),
        type: String(row.data_type),
        nullable: Boolean(row.is_nullable),
      });
    }

    // One query for all indexes across every registered table.
    const indexMap = await this.getAllIndexes(conn, tableSet, nameList);

    const tables: TableSchema[] = this.tableNames.map((name) => {
      const fields = columnsByTable.get(name) ?? [];
      return { name, columnCount: fields.length, fields, indexes: indexMap.get(name) ?? [] };
    });
    return { tables };
  }

  /**
   * Query indexes for all registered tables from DuckDB's catalog in two queries:
   *   1. duckdb_constraints() — PRIMARY KEY and UNIQUE constraints (with column names)
   *   2. duckdb_indexes()     — secondary indexes (column names parsed from the `sql` column)
   * Returns an empty array per table for file-based sources (no indexes).
   */
  private async getAllIndexes(
    conn: DuckDBConnection,
    tableSet: Set<string>,
    nameList: string
  ): Promise<Map<string, TableIndex[]>> {
    const result = new Map<string, TableIndex[]>();
    for (const name of tableSet) result.set(name, []);

    // 1. Constraints (PK / UNIQUE) — has constraint_column_names directly.
    try {
      const reader = await conn.runAndReadAll(
        `SELECT table_name, constraint_name, constraint_type, constraint_column_names
           FROM duckdb_constraints()
          WHERE table_name IN (${nameList})
            AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')`
      );
      for (const row of reader.getRowObjectsJson()) {
        const tableName = String(row.table_name);
        if (!tableSet.has(tableName)) continue;
        const type = String(row.constraint_type);
        const columns = Array.isArray(row.constraint_column_names) ? row.constraint_column_names.map(String) : [];
        result.get(tableName)!.push({
          name: String(row.constraint_name),
          columns,
          unique: true,
          primary: type === 'PRIMARY KEY',
        });
      }
    } catch {
      // duckdb_constraints() unavailable — skip.
    }

    // 2. Secondary indexes — parse column names from the `sql` (CREATE INDEX) column.
    try {
      const reader = await conn.runAndReadAll(
        `SELECT table_name, index_name, is_unique, sql
           FROM duckdb_indexes()
          WHERE table_name IN (${nameList})`
      );
      for (const row of reader.getRowObjectsJson()) {
        const tableName = String(row.table_name);
        if (!tableSet.has(tableName)) continue;
        const sqlDef = String(row.sql ?? '');
        const columns = this.parseIndexColumnsFromDDL(sqlDef);
        result.get(tableName)!.push({
          name: String(row.index_name),
          columns,
          unique: Boolean(row.is_unique),
        });
      }
    } catch {
      // duckdb_indexes() unavailable — skip.
    }

    return result;
  }

  /**
   * Extract column names from a CREATE INDEX statement like
   * `CREATE INDEX idx_name ON table (col1, col2)`.
   */
  private parseIndexColumnsFromDDL(sql: string): string[] {
    const match = sql.match(/\(([^)]+)\)/);
    if (!match) return [];
    return match[1]
      .split(',')
      .map((col) => col.trim())
      .filter(Boolean);
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
