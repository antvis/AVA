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
import { parseProfileOptions } from '../util/profile';

import { DEFAULT_METRICS, BUILTIN_METRICS, profileTables } from './profile';
import { loadSource } from './loaders';

import type { DuckDBConnection } from '@duckdb/node-api';
import type {
  AnalysisEngine,
  Profile,
  ProfileOptions,
  DataSourceConfig,
  DuckDBEngineOptions,
  Schema,
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
  readonly language = {
    name: 'DuckDB SQL dialect',
    fence: 'sql',
  };

  private instance: DuckDBInstance | null = null;
  private connection: DuckDBConnection | null = null;
  private schema: Schema | null = null;
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
    this.schema = null;
    try {
      const source = await loadSource(config, this.llmConfig);
      const conn = await this.getConnection();
      this.cleanup = source.cleanup;
      await source.register(conn);
      this.schema = await source.getSchema(conn);
      await this.restrictAccess(conn, source.allowedDirectories);
    } catch (error) {
      await this.cleanup?.();
      this.cleanup = null;
      this.close();
      throw error;
    }

    return this.schema!;
  }

  async getDSL(query: string): Promise<string> {
    if (!this.schema) throw new Error('No data loaded. Please call load() first.');

    return this.queryDialect.getDSL(query, this.schema);
  }

  // TODO(profile, on demand): Cache only with reliable data versions and request-based invalidation.
  async profile(options: ProfileOptions = {}): Promise<Profile> {
    if (!this.schema || !this.connection) {
      throw new Error('No data loaded. Please call load() first.');
    }

    const defaultOptions = { metrics: DEFAULT_METRICS };
    const parsedOptions = parseProfileOptions(options, defaultOptions);

    return profileTables(this.connection, this.schema, parsedOptions);
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
    this.schema = null;
  }

  async dispose(): Promise<void> {
    this.close();
    await this.cleanup?.();
    this.cleanup = null;
  }
}
