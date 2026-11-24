/**
 * Snowflake engine: the LLM generates Snowflake SQL that runs in Snowflake through the official
 * Node.js driver (snowflake-sdk). The session's role controls access; query results return to AVA.
 */
import { SnowflakeQueryDialect } from '../../query/snowflake';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, maxRows, maxResultBytes, resultRowBytes } from '../../util/result';
import { runWithTimeout } from '../../util/timeout';
import { onAbort, throwIfAborted } from '../../util/abort';

import { profileTables } from './profile';
import { convertRow, queryColumn } from './result';
import { getSnowflakeSchema } from './schema';

import type { Readable } from 'node:stream';
import type { Binds, Connection, RowStatement } from 'snowflake-sdk';
import type { SnowflakeScope } from './schema';
import type {
  AnalysisEngine,
  DataModel,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  QueryColumn,
  Profile,
  ProfileOptions,
  Schema,
  LLMConfig,
  TranslationResult,
} from '../../types';

type Driver = typeof import('snowflake-sdk');
type Rows = Record<string, unknown>[];
type QueryResult = { rows: Rows; columns: QueryColumn[]; truncatedBy?: ExecutionResult['truncatedBy'] };

const DEFAULT_QUERY_TIMEOUT_MS = 30_000;
/** Cleanup never waits longer than this for Snowflake to acknowledge a cancel or logout. */
const CLEANUP_TIMEOUT_MS = 10_000;

/** Thrown when a statement exceeds queryTimeoutMs and cancellation is requested. */
export class SnowflakeQueryTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Snowflake query timed out after ${timeoutMs}ms. Cancellation requested.`);
    this.name = 'SnowflakeQueryTimeoutError';
  }
}

let driver: Promise<Driver> | undefined;

/**
 * Load the driver on first use, so other engines do not pay for it. Its default logger writes every
 * connection event to stdout, which AVA turns off; Snowflake's client configuration file (Easy
 * Logging) can still enable driver logs.
 */
function loadDriver(): Promise<Driver> {
  driver ??= import('snowflake-sdk').then((module) => {
    const snowflake = (module as { default?: Driver }).default ?? module;
    snowflake.configure({ logLevel: 'OFF' });
    return snowflake;
  });
  return driver;
}

/**
 * Session settings applied once after login. They limit running and queued time in Snowflake, so the
 * limits hold even if this process dies, and abort statements whose client disconnected. JSON values
 * become strict JSON, so NaN and Infinity arrive as strings instead of going through the driver's
 * eval fallback. The driver formats dates, times and timestamps with the session formats, and
 * statement-level overrides do not reach it; fixed formats make results identical for every account.
 * Analysis statements cannot change these settings, because ALTER SESSION never passes validation.
 */
function sessionSettings(timeoutMs: number): string {
  const seconds = Math.ceil(timeoutMs / 1000);
  return `ALTER SESSION SET
    MULTI_STATEMENT_COUNT = 1
    STATEMENT_TIMEOUT_IN_SECONDS = ${seconds}
    STATEMENT_QUEUED_TIMEOUT_IN_SECONDS = ${seconds}
    ABORT_DETACHED_QUERY = TRUE
    STRICT_JSON_OUTPUT = TRUE
    BINARY_OUTPUT_FORMAT = 'HEX'
    DATE_OUTPUT_FORMAT = 'YYYY-MM-DD'
    TIME_OUTPUT_FORMAT = 'HH24:MI:SS.FF9'
    TIMESTAMP_NTZ_OUTPUT_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF9'
    TIMESTAMP_LTZ_OUTPUT_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF9 TZH:TZM'
    TIMESTAMP_TZ_OUTPUT_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF9 TZH:TZM'`;
}

function waitForCleanup(action: string, operation: (done: (error?: Error | null) => void) => void): Promise<void> {
  return runWithTimeout(
    new Promise<void>((resolve, reject) => {
      operation((error) => (error ? reject(error) : resolve()));
    }),
    CLEANUP_TIMEOUT_MS,
    { onTimeout: () => new Error(`Snowflake ${action} timed out`), unref: true }
  );
}

export class SnowflakeEngine implements AnalysisEngine {
  readonly dialect: SnowflakeQueryDialect;

  private connection: Connection | null = null;
  private scope: SnowflakeScope | null = null;
  private timeoutMs = DEFAULT_QUERY_TIMEOUT_MS;
  /** Active statements and their shared local and server-side cancellation. */
  private readonly running = new Map<RowStatement, (error: Error) => Promise<void>>();

  constructor(llmConfig: LLMConfig) {
    this.dialect = new SnowflakeQueryDialect(llmConfig, async (query, signal) => {
      this.requireScope();
      await this.run(query, { describeOnly: true, signal });
    });
  }

  async load(configs: DataSourceConfig | DataSourceConfig[]): Promise<void> {
    const sources = Array.isArray(configs) ? configs : [configs];
    if (sources.length !== 1) {
      throw new Error(`SnowflakeEngine currently supports exactly one data source, received ${sources.length}`);
    }
    const config = sources[0];
    await this.dispose();
    if (config.type !== 'snowflake') {
      throw new Error(`SnowflakeEngine only supports 'snowflake' data sources, got '${config.type}'`);
    }
    const { queryTimeoutMs = DEFAULT_QUERY_TIMEOUT_MS, schema = 'PUBLIC', ...options } = config.options;
    if (!Number.isSafeInteger(queryTimeoutMs) || queryTimeoutMs <= 0) {
      throw new Error('Snowflake queryTimeoutMs must be a positive integer');
    }

    const snowflake = await loadDriver();
    const connection = snowflake.createConnection({
      queryTag: 'AVA',
      ...options,
      schema,
      // AVA converts result values itself and ends the server session together with the source.
      jsTreatIntegerAsBigInt: false,
      representNullAsStringNull: false,
      serverSessionKeepAlive: false,
    });
    this.connection = connection;
    this.timeoutMs = queryTimeoutMs;

    try {
      // connect() reports every login failure through its callback; connectAsync() resolves on some.
      await new Promise<void>((resolve, reject) => {
        connection.connect((error) => (error ? reject(error) : resolve()));
      });
      await this.runQuery(sessionSettings(queryTimeoutMs));
      // Snowflake accepts a login whose database, schema or warehouse is missing or not granted, and
      // leaves it unset; check here so the problem is reported at load time.
      const [session] = await this.runQuery(
        'SELECT CURRENT_DATABASE() AS "database", CURRENT_SCHEMA() AS "schema", CURRENT_WAREHOUSE() AS "warehouse", CURRENT_ROLE() AS "role"'
      );
      if (!session?.database || !session.schema) {
        throw new Error(
          `Snowflake schema ${options.database}.${schema} does not exist or is not authorized for role ${session?.role}`
        );
      }
      if (!session.warehouse) {
        throw new Error(
          `No usable Snowflake warehouse for role ${session.role}: set options.warehouse (or the user's DEFAULT_WAREHOUSE) to a warehouse the role can use`
        );
      }
      this.scope = { database: String(session.database), schema: String(session.schema) };
    } catch (error) {
      await this.dispose().catch(() => {});
      throw error;
    }
  }

  async schema(signal?: AbortSignal): Promise<Schema> {
    return getSnowflakeSchema((sql, binds) => this.runQuery(sql, binds, signal), this.requireScope());
  }

  async profile(schema: Schema, options: ProfileOptions = {}, signal?: AbortSignal): Promise<Profile> {
    this.requireScope();
    throwIfAborted(signal);
    return profileTables(
      (sql) => this.runQuery(sql, undefined, signal),
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel, signal?: AbortSignal): Promise<TranslationResult> {
    this.requireScope();
    return signal ? this.dialect.getDSL(query, dataModel, signal) : this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(
    dsl: string,
    options?: ExecutionOptions,
    signal?: AbortSignal
  ): Promise<ExecutionResult<T>> {
    this.requireScope();
    throwIfAborted(signal);
    const sql = await (signal ? this.dialect.validateDSL(dsl, signal) : this.dialect.validateDSL(dsl));
    // One row beyond the limit reveals truncation without fetching the rest of the result.
    const { rows, columns, truncatedBy } = await this.run(sql, {
      limit: maxRows(options) + 1,
      maxBytes: maxResultBytes(options),
      signal,
    });
    return executionResult(rows as T[], columns, options, truncatedBy);
  }

  async dispose(): Promise<void> {
    const connection = this.connection;
    const running = [...this.running.values()];
    this.connection = null;
    this.scope = null;
    this.running.clear();
    // Closing a Snowflake session does not stop the statements it started, so cancel them first.
    const error = new Error('Snowflake source was disposed');
    const cancelled = await Promise.allSettled(running.map((cancel) => cancel(error)));
    const failure = cancelled.find((result) => result.status === 'rejected');
    try {
      if (connection) await waitForCleanup('logout', (done) => connection.destroy(done));
    } catch (error) {
      if (!failure) throw error;
    }
    if (failure) throw failure.reason;
  }

  private requireScope(): SnowflakeScope {
    if (!this.scope) throw new Error('No data loaded. Please call source() first.');
    return this.scope;
  }

  private async runQuery(sql: string, binds?: Binds, signal?: AbortSignal): Promise<Rows> {
    return (await this.run(sql, { binds, signal })).rows;
  }

  /**
   * Run one statement within the source's timeout. Rows are streamed and at most `limit` are fetched
   * (Snowflake also stops producing rows at ROWS_PER_RESULTSET). On timeout AVA requests cancellation.
   */
  private async run(
    sqlText: string,
    {
      binds,
      limit,
      maxBytes,
      describeOnly = false,
      signal,
    }: {
      binds?: Binds;
      limit?: number;
      maxBytes?: number;
      describeOnly?: boolean;
      signal?: AbortSignal;
    } = {}
  ): Promise<QueryResult> {
    const connection = this.connection;
    if (!connection) throw new Error('No data loaded. Please call source() first.');
    throwIfAborted(signal);
    const timeoutMs = this.timeoutMs;

    let statement: RowStatement | undefined;
    let stream: Readable | undefined;
    let stopped = false;
    let serverCompleted = false;
    // The Promise executor assigns this synchronously before registration or timeout handling.
    let stop!: (error: Error) => void;
    const result = new Promise<QueryResult>((resolve, reject) => {
      stop = (error) => {
        stopped = true;
        stream?.destroy();
        reject(error);
      };
      statement = connection.execute({
        sqlText,
        binds,
        describeOnly,
        streamResult: true,
        rowMode: 'object_with_renamed_duplicated_columns',
        fetchAsString: ['Number', 'Date', 'Buffer'],
        parameters: { MULTI_STATEMENT_COUNT: 1, ...(limit ? { ROWS_PER_RESULTSET: limit } : {}) },
        complete: (error, completed) => {
          serverCompleted = !error;
          if (stopped) {
            if (serverCompleted && statement) this.running.delete(statement);
            return;
          }
          if (error) {
            reject(error);
            return;
          }
          const columns = completed.getColumns() ?? [];
          const schema = columns.map(queryColumn);
          if (describeOnly) {
            resolve({ rows: [], columns: schema });
            return;
          }
          const rows: Rows = [];
          let bytes = 0;
          const finish = (truncatedBy?: ExecutionResult['truncatedBy']) => {
            stopped = true;
            stream?.destroy();
            resolve({ rows, columns: schema, truncatedBy });
          };
          stream = completed.streamRows(limit ? { start: 0, end: limit - 1 } : undefined);
          stream
            .on('data', (row: Record<string, unknown>) => {
              if (stopped) return;
              // The extra row only detects truncation; its fields are never returned or validated.
              if (limit && rows.length === limit - 1) {
                rows.push(row);
                finish();
                return;
              }
              try {
                const value = convertRow(row, columns);
                if (maxBytes !== undefined) {
                  const rowBytes = resultRowBytes(value);
                  if (bytes + rowBytes > maxBytes) {
                    finish('maxResultBytes');
                    return;
                  }
                  bytes += rowBytes;
                }
                rows.push(value);
              } catch (error) {
                stop(error as Error);
              }
            })
            .on('error', reject)
            .on('end', () => finish());
        },
      });
    });

    const current = statement;
    let cancellationRequested = false;
    let cancellation: Promise<void> | undefined;
    const cancel = (error: Error) => {
      if (!cancellationRequested) {
        cancellationRequested = true;
        stop(error);
      }
      if (!current) return Promise.resolve();
      return (cancellation ??= waitForCleanup('cancellation', (done) => current.cancel(done))
        .catch((error) => {
          // Keep unconfirmed statements registered so disposal can try again.
          if (serverCompleted) return;
          cancellation = undefined;
          throw error;
        })
        .then(() => {
          this.running.delete(current);
        }));
    };
    if (current) this.running.set(current, cancel);
    const requestCancellation = (error: Error) => void cancel(error).catch(() => {});
    const detach = onAbort(signal, requestCancellation);
    try {
      const response = await runWithTimeout(result, timeoutMs, {
        onTimeout: () => {
          const error = new SnowflakeQueryTimeoutError(timeoutMs);
          requestCancellation(error);
          return error;
        },
        unref: true,
      });
      throwIfAborted(signal);
      return response;
    } catch (error) {
      throwIfAborted(signal);
      throw error;
    } finally {
      detach();
      stopped = true;
      stream?.destroy();
      if (current && !cancellationRequested) this.running.delete(current);
    }
  }
}
