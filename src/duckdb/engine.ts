/**
 * DuckDB engine: LLM generates SQL, executed against an in-memory DuckDB instance.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DuckDBSQLDialect } from '../query/duckdb-sql';
import { executionResult, maxRows } from '../util/result';
import { coerceNumbers } from '../util/coerce';
import { sqlIdentifier, sqlStringLiteral } from '../util/sql';
import { findAvailableName, parseSourceConfigs } from '../util/source';
import { parseProfileOptions } from '../util/profile';
import { runWithTimeout } from '../util/timeout';
import { profileInputSchema } from '../contracts';

import { DEFAULT_METRICS, profileTables } from './profile';
import { loadSource } from './loaders';

import type { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import type {
  TranslationResult,
  AnalysisEngine,
  Profile,
  ProfileOptions,
  DataModel,
  DataSourceConfig,
  Schema,
  ExecutionOptions,
  ExecutionResult,
  LoadedSource,
  DuckDBEngineOptions,
  LLMConfig,
} from '../types';

/**
 * Process-level security baseline: DuckDB extensions run with the same
 * privileges as the host process, so disable auto-install/auto-load and keep
 * community extensions off by default at instance creation. The mysql/postgres
 * loaders still work because those extensions are statically linked (built-in),
 * so an explicit `LOAD mysql`/`LOAD postgres` is unaffected by these flags.
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

// Built-in schemas and catalogs can conflict with two-part source.table references.
const RESERVED_NAMESPACES = ['main', 'memory', 'system', 'temp', 'information_schema', 'pg_catalog'];

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
  private sources: { source: LoadedSource; namespace?: string }[] = [];
  private tempDirectory: string | null = null;
  readonly dialect: DuckDBSQLDialect;
  private allowCommunityExtensions = false;

  constructor(private readonly llmConfig: LLMConfig, private readonly engineOptions: DuckDBEngineOptions = {}) {
    this.dialect = new DuckDBSQLDialect(llmConfig);
  }

  /**
   * Get or create the DuckDB connection (lazy loading)
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (this.connection) return this.connection;

    const { DuckDBInstance } = await import('@duckdb/node-api');
    this.instance = await DuckDBInstance.create(':memory:', {
      ...EXTENSION_LOCKDOWN,
      allow_community_extensions:
        this.allowCommunityExtensions || this.engineOptions.allowCommunityExtensions ? 'true' : 'false',
    });
    this.connection = await this.instance.connect();
    return this.connection;
  }

  /**
   * Harden the session after the data view is registered: allow only source
   * files and private spill storage, then disable external access and lock the
   * configuration so LLM-generated SQL cannot read arbitrary files or undo it.
   */
  private async restrictAccess(conn: DuckDBConnection, allowedPaths: string[]): Promise<void> {
    // Resource limits must be set before lock_configuration (which freezes all
    // settings). They bound a runaway LLM-generated query's memory/CPU/disk.
    await conn.run(`SET memory_limit = ${sqlStringLiteral(this.engineOptions.memoryLimit ?? DEFAULT_MEMORY_LIMIT)}`);
    await conn.run(`SET threads = ${this.engineOptions.threads ?? DEFAULT_THREADS}`);
    if (this.engineOptions.maxTempDirectorySize) {
      await conn.run(`SET max_temp_directory_size = ${sqlStringLiteral(this.engineOptions.maxTempDirectorySize)}`);
    }
    await conn.run(`SET allowed_paths = [${allowedPaths.map(sqlStringLiteral).join(', ')}]`);
    // Spill files need directory access, but must never share it with other sources.
    this.tempDirectory = await mkdtemp(join(tmpdir(), 'ava-duckdb-'));
    await conn.run(`SET temp_directory = ${sqlStringLiteral(this.tempDirectory)}`);
    await conn.run('SET enable_external_access = false');
    // Lock last so the settings above cannot be changed again.
    await conn.run('SET lock_configuration = true');
  }

  async load(configs: DataSourceConfig | DataSourceConfig[]): Promise<void> {
    const sources = parseSourceConfigs(configs, RESERVED_NAMESPACES);
    const multiple = sources.length > 1;
    const namespaces = new Set(sources.map(({ name }) => name.toLowerCase()));
    const loaded: DuckDBEngine['sources'] = [];
    let nextAttachIndex = 1;
    await this.dispose();
    this.allowCommunityExtensions = sources.some(({ type }) => type === 'mongodb');
    try {
      const conn = await this.getConnection();
      for (const config of sources) {
        let namespace: string | undefined;
        let attachAlias: string | undefined;
        if (multiple) {
          namespace = config.name;
          attachAlias = findAvailableName(namespaces, () => `ava_attached_${nextAttachIndex++}`);
          await conn.run(`CREATE SCHEMA ${sqlIdentifier(namespace)}`);
        }
        const source = await loadSource(config, this.llmConfig, attachAlias);
        loaded.push({ source, namespace });
        await source.register(conn, namespace);
      }
      await this.restrictAccess(conn, [...new Set(loaded.flatMap(({ source }) => source.allowedPaths))]);
    } catch (error) {
      this.sources = loaded;
      await this.dispose();
      throw error;
    }
    this.sources = loaded;
  }

  async schema(): Promise<Schema> {
    if (!this.sources.length || !this.connection) throw new Error('No data loaded. Please call source() first.');

    const models: Schema['models'] = [];
    const relationships: NonNullable<Schema['relationships']> = [];
    const views: NonNullable<Schema['views']> = [];
    for (const { source, namespace } of this.sources) {
      const schema = await source.getSchema(this.connection, namespace);
      models.push(...schema.models);
      relationships.push(...(schema.relationships ?? []));
      views.push(...(schema.views ?? []));
    }
    return { models, relationships, views };
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.sources.length || !this.connection) {
      throw new Error('No data loaded. Please call source() first.');
    }

    const defaultOptions = { metrics: DEFAULT_METRICS };
    const { semantics, ...selection } = profileInputSchema.parse(options);
    const parsedOptions = { ...parseProfileOptions(selection, defaultOptions), semantics };

    return profileTables(this.connection, schema, parsedOptions);
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.sources.length) throw new Error('No data loaded. Please call source() first.');

    return this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(sql: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.sources.length || !this.connection) throw new Error('No data loaded. Please call source() first.');

    const conn = this.connection;
    const query = await this.dialect.validateDSL(sql);
    const timeoutMs = this.engineOptions.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
    // query() parses the original source; a quoted constant keeps its own parameters unbound.
    // https://duckdb.org/docs/1.5/guides/sql_features/query_and_query_table_functions
    const reader = await runWithTimeout(
      conn.runAndReadAll(`SELECT * FROM query(${sqlStringLiteral(query)}) LIMIT ${maxRows(options) + 1}`),
      timeoutMs,
      {
        onTimeout: () => {
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
    const names = reader.deduplicatedColumnNames();
    // The driver's object conversion assigns __proto__ through the prototype setter.
    const rows = reader
      .getRowsJson()
      .map((row) => Object.fromEntries(row.map((value, index) => [names[index], value])));
    return executionResult(coerceNumbers(rows, schema) as T[], schema, options);
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
    const sources = this.sources;
    const tempDirectory = this.tempDirectory;
    this.sources = [];
    this.tempDirectory = null;
    this.close();
    let failure: PromiseRejectedResult | undefined;
    try {
      await this.dialect.dispose();
    } finally {
      const results = await Promise.allSettled(sources.map(async ({ source }) => source.cleanup()));
      failure = results.find((result) => result.status === 'rejected');
      if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
    }
    if (failure) throw failure.reason;
  }
}
