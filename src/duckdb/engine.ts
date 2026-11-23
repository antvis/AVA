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
import { createAbortError, onAbort, throwIfAborted } from '../util/abort';

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
 * community extensions off by default at instance creation. Data source
 * loaders can explicitly install and load the extensions they require.
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
  private operations: Promise<void> = Promise.resolve();
  private lifetime = new AbortController();
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
    this.operations = Promise.resolve();
    this.lifetime = new AbortController();
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

  async schema(signal?: AbortSignal): Promise<Schema> {
    return this.withConnection(signal, async (connection, commandSignal) => {
      const models: Schema['models'] = [];
      const relationships: NonNullable<Schema['relationships']> = [];
      const views: NonNullable<Schema['views']> = [];
      for (const { source, namespace } of this.sources) {
        throwIfAborted(commandSignal);
        const schema = await source.getSchema(connection, namespace);
        models.push(...schema.models);
        relationships.push(...(schema.relationships ?? []));
        views.push(...(schema.views ?? []));
      }
      return { models, relationships, views };
    });
  }

  async profile(schema: Schema, options: ProfileOptions = {}, signal?: AbortSignal): Promise<Profile> {
    return this.withConnection(signal, (connection, commandSignal) =>
      profileTables(connection, schema, parseProfileOptions(options, { metrics: DEFAULT_METRICS }), commandSignal)
    );
  }

  async getDSL(query: string, dataModel: DataModel, signal?: AbortSignal): Promise<TranslationResult> {
    if (!this.sources.length) throw new Error('No data loaded. Please call source() first.');

    return signal ? this.dialect.getDSL(query, dataModel, signal) : this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(
    sql: string,
    options?: ExecutionOptions,
    signal?: AbortSignal
  ): Promise<ExecutionResult<T>> {
    return this.withConnection(signal, async (conn, commandSignal, holdConnection) => {
      const query = await this.dialect.validateDSL(sql);
      throwIfAborted(commandSignal);
      const timeoutMs = this.engineOptions.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
      // query() parses the original source; a quoted constant keeps its own parameters unbound.
      // https://duckdb.org/docs/2.0/guides/sql_features/query_and_query_table_functions
      const pending = conn.runAndReadAll(
        `SELECT * FROM query(${sqlStringLiteral(query)}) LIMIT ${maxRows(options) + 1}`
      );
      holdConnection(pending);
      const reader = await runWithTimeout(pending, timeoutMs, {
        onTimeout: () => {
          conn.interrupt();
          return new QueryTimeoutError(timeoutMs);
        },
        unref: true,
      });
      throwIfAborted(commandSignal);
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
    });
  }

  private async withConnection<T>(
    caller: AbortSignal | undefined,
    operation: (
      connection: DuckDBConnection,
      signal: AbortSignal,
      holdConnection: (pending: Promise<unknown>) => void
    ) => Promise<T>
  ): Promise<T> {
    const connection = this.connection;
    if (!this.sources.length || !connection) throw new Error('No data loaded. Please call source() first.');
    const signal = caller ? AbortSignal.any([caller, this.lifetime.signal]) : this.lifetime.signal;
    throwIfAborted(signal);

    // Interrupt applies to the entire connection, so only its current operation may install a listener.
    let nativeWork: Promise<void> | undefined;
    const result = this.operations.then(async () => {
      throwIfAborted(signal);
      const detach = onAbort(signal, () => connection.interrupt());
      try {
        const value = await operation(connection, signal, (pending) => {
          nativeWork = pending.then(
            () => undefined,
            () => undefined
          );
        });
        throwIfAborted(signal);
        return value;
      } catch (error) {
        throwIfAborted(signal);
        throw error;
      } finally {
        detach();
      }
    });
    // The caller can time out before DuckDB has finished handling the interrupt.
    this.operations = result.then(
      () => undefined,
      () => nativeWork
    );
    return result;
  }

  /**
   * Close the database connection and instance
   */
  private async close(): Promise<void> {
    const connection = this.connection;
    const instance = this.instance;
    this.connection = null;
    this.instance = null;
    this.allowCommunityExtensions = false;
    this.lifetime.abort(createAbortError('Data source is no longer loaded.'));
    await this.operations;
    try {
      connection?.closeSync();
      instance?.closeSync();
    } catch {
      // already closed
    }
  }

  async dispose(): Promise<void> {
    const sources = this.sources;
    const tempDirectory = this.tempDirectory;
    this.sources = [];
    this.tempDirectory = null;
    await this.close();
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
