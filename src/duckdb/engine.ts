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
import { runWithTimeout } from '../util/timeout';

import { DEFAULT_METRICS, profileTables } from './profile';
import { loadSource } from './loaders';

import type { DuckDBConnection } from '@duckdb/node-api';
import type {
  AnalysisEngine,
  Profile,
  ProfileOptions,
  DataModel,
  DataSourceConfig,
  LoadedSource,
  DuckDBEngineOptions,
  Schema,
  LLMConfig,
  ExecutionOptions,
  ExecutionResult,
} from '../types';

/**
 * Process-level security baseline: DuckDB extensions run with the same
 * privileges as the host process, so disable auto-install/auto-load and keep
 * community extensions off by default at instance creation. Loaders explicitly
 * install and load their known extensions before the session is locked.
 * https://duckdb.org/docs/current/operations_manual/securing_duckdb/securing_extensions
 */
const EXTENSION_LOCKDOWN = {
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
  private source: LoadedSource | null = null;
  private readonly queryDialect: DuckDBQueryDialect;
  private allowCommunityExtensions = false;

  constructor(private readonly llmConfig: LLMConfig, private readonly engineOptions: DuckDBEngineOptions = {}) {
    this.queryDialect = new DuckDBQueryDialect(llmConfig);
  }

  /**
   * Get or create the DuckDB connection (lazy loading)
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (this.connection) return this.connection;

    this.instance = await DuckDBInstance.create(':memory:', {
      ...EXTENSION_LOCKDOWN,
      allow_community_extensions:
        this.allowCommunityExtensions || this.engineOptions.allowCommunityExtensions ? 'true' : 'false',
    });
    this.connection = await this.instance.connect();
    // Bound ingestion as well as queries; JSON is materialized during registration.
    await this.connection.run(
      `SET memory_limit = ${sqlStringLiteral(this.engineOptions.memoryLimit ?? DEFAULT_MEMORY_LIMIT)}`
    );
    await this.connection.run(`SET threads = ${this.engineOptions.threads ?? DEFAULT_THREADS}`);
    if (this.engineOptions.maxTempDirectorySize) {
      await this.connection.run(
        `SET max_temp_directory_size = ${sqlStringLiteral(this.engineOptions.maxTempDirectorySize)}`
      );
    }
    const tempBase = this.source?.allowedDirectories[0] ?? tmpdir();
    await this.connection.run(`SET temp_directory = ${sqlStringLiteral(join(tempBase, '.dbtmp'))}`);
    return this.connection;
  }

  /**
   * Harden the session after the data source is registered: whitelist the data
   * file's directories, then disable further external access and lock the
   * configuration so LLM-generated SQL cannot read arbitrary files or undo it.
   */
  private async restrictAccess(
    conn: DuckDBConnection,
    allowedDirectories: string[],
    allowedPaths: string[] = []
  ): Promise<void> {
    if (allowedDirectories.length > 0) {
      await conn.run(`SET allowed_directories = [${allowedDirectories.map(sqlStringLiteral).join(', ')}]`);
    }
    if (allowedPaths.length > 0) {
      await conn.run(`SET allowed_paths = [${allowedPaths.map(sqlStringLiteral).join(', ')}]`);
    }
    // en Postgres catalog, external access must be disabled before disabling the local filesystem; configuration lock must be set last.
    // Keep only the source directories/URLs accessible after registration.
    await conn.run('SET enable_external_access = false');
    if (allowedDirectories.length === 0) {
      // No local data file to read — disable the local filesystem entirely.
      await conn.run("SET disabled_filesystems = 'LocalFileSystem'");
    }
    // Lock last so the settings above cannot be changed again.
    await conn.run('SET lock_configuration = true');
  }

  async load(config: DataSourceConfig): Promise<void> {
    await this.dispose();
    this.allowCommunityExtensions = config.type === 'mongodb';
    try {
      this.source = await loadSource(config, this.llmConfig);
      const conn = await this.getConnection();
      await this.source.register(conn);
      await this.restrictAccess(conn, this.source.allowedDirectories, this.source.allowedPaths);
    } catch (error) {
      await this.dispose();
      throw error;
    }
  }

  async schema(): Promise<Schema> {
    if (!this.source || !this.connection) throw new Error('No data loaded. Please call source() first.');

    return this.source.getSchema(this.connection);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.source || !this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }

    const defaultOptions = { metrics: DEFAULT_METRICS };
    const parsedOptions = parseProfileOptions(options, defaultOptions);

    return profileTables(this.connection, schema, parsedOptions);
  }

  async getDSL(query: string, dataModel: DataModel): Promise<string> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    return this.queryDialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(sql: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.source || !this.connection) throw new Error('No data loaded. Please call source() first.');

    const conn = this.connection;
    const timeoutMs = this.engineOptions.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
    let timedOut = false;
    const reader = await runWithTimeout(
      (async () => {
        // Preparing a direct remote scan can perform network I/O too.
        const query = await this.queryDialect.validateDSL(sql, conn);
        if (timedOut) throw new QueryTimeoutError(timeoutMs);
        return conn.runAndReadAll(limitedQuery(query, maxRows(options)));
      })(),
      timeoutMs,
      {
        onTimeout: () => {
          timedOut = true;
          conn.interrupt();
          return new QueryTimeoutError(timeoutMs);
        },
        unref: true,
      }
    );
    const schema = Array.from({ length: reader.columnCount }, (_, index) => ({
      name: reader.columnName(index),
      type: reader.columnType(index).toString(),
    }));
    return executionResult(coerceNumbers(reader.getRowObjectsJson(), schema) as T[], schema, options);
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
    this.allowCommunityExtensions = false;
  }

  async dispose(): Promise<void> {
    const source = this.source;
    this.source = null;
    this.close();
    await source?.cleanup();
  }
}
