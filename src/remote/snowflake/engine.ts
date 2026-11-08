/**
 * Snowflake engine: the LLM generates Snowflake SQL that runs in Snowflake through the official
 * Node.js driver (snowflake-sdk). The session's role controls access; query results return to AVA.
 */
import { SnowflakeQueryDialect } from '../../query/snowflake';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, maxRows } from '../../util/result';
import { runWithTimeout } from '../../util/timeout';

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
  LLMConfig,
  Profile,
  ProfileOptions,
  QueryColumn,
  Schema,
  TranslationResult,
} from '../../types';

type Driver = typeof import('snowflake-sdk');
type Rows = Record<string, unknown>[];

const DEFAULT_QUERY_TIMEOUT_MS = 30_000;
/** Cleanup never waits longer than this for Snowflake to acknowledge a cancel or logout. */
const CLEANUP_TIMEOUT_MS = 10_000;

/** Thrown when a statement exceeds queryTimeoutMs; the statement is cancelled in Snowflake. */
export class SnowflakeQueryTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Snowflake query timed out after ${timeoutMs}ms and was cancelled`);
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

/** Wait for a best-effort cleanup callback, ignoring its errors and giving up after CLEANUP_TIMEOUT_MS. */
async function settle(operation: (done: () => void) => void): Promise<void> {
  const settled = new Promise<void>((resolve) => {
    try {
      operation(resolve);
    } catch {
      resolve();
    }
  });
  await runWithTimeout(settled, CLEANUP_TIMEOUT_MS, {
    onTimeout: () => new Error('cleanup timed out'),
    unref: true,
  }).catch(() => undefined);
}

export class SnowflakeEngine implements AnalysisEngine {
  readonly language = {
    name: 'Snowflake SQL dialect',
    fence: 'sql',
    instructions:
      'Write one read-only SELECT statement (WITH is allowed). Double-quote table and column names exactly as listed, because quoted Snowflake identifiers are case-sensitive. SYSTEM$ functions and procedures are rejected.',
  };

  private connection: Connection | null = null;
  private scope: SnowflakeScope | null = null;
  private timeoutMs = DEFAULT_QUERY_TIMEOUT_MS;
  /** Active statements and callbacks that stop their local result streams. */
  private readonly running = new Map<RowStatement, (error: Error) => void>();
  private readonly queryDialect: SnowflakeQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new SnowflakeQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<void> {
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
      await this.dispose();
      throw error;
    }
  }

  async schema(): Promise<Schema> {
    return getSnowflakeSchema((sql, binds) => this.runQuery(sql, binds), this.requireScope());
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    this.requireScope();
    return profileTables(
      (sql) => this.runQuery(sql),
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    this.requireScope();
    return this.queryDialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    this.requireScope();
    const sql = await this.queryDialect.validateDSL(dsl, async (query) => {
      await this.run(query, { describeOnly: true });
    });
    // One row beyond the limit reveals truncation without fetching the rest of the result.
    const { rows, columns } = await this.run(sql, { limit: maxRows(options) + 1 });
    return executionResult(rows as T[], columns, options);
  }

  async dispose(): Promise<void> {
    const connection = this.connection;
    const running = [...this.running];
    this.connection = null;
    this.scope = null;
    this.running.clear();
    // Closing a Snowflake session does not stop the statements it started, so cancel them first.
    await Promise.all(
      running.map(([statement, stop]) => {
        stop(new Error('Snowflake source was disposed'));
        return settle((done) => statement.cancel(() => done()));
      })
    );
    if (connection) await settle((done) => connection.destroy(() => done()));
  }

  private requireScope(): SnowflakeScope {
    if (!this.scope) throw new Error('No data loaded. Please call source() first.');
    return this.scope;
  }

  private async runQuery(sql: string, binds?: Binds): Promise<Rows> {
    return (await this.run(sql, { binds })).rows;
  }

  /**
   * Run one statement within the source's timeout. Rows are streamed and at most `limit` are fetched
   * (Snowflake also stops producing rows at ROWS_PER_RESULTSET). On timeout the statement is cancelled.
   */
  private async run(
    sqlText: string,
    { binds, limit, describeOnly = false }: { binds?: Binds; limit?: number; describeOnly?: boolean } = {}
  ): Promise<{ rows: Rows; columns: QueryColumn[] }> {
    const connection = this.connection;
    if (!connection) throw new Error('No data loaded. Please call source() first.');
    const timeoutMs = this.timeoutMs;

    let statement: RowStatement | undefined;
    let stream: Readable | undefined;
    let stopped = false;
    let stop: (error: Error) => void;
    const result = new Promise<{ rows: Rows; columns: QueryColumn[] }>((resolve, reject) => {
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
          if (stopped) return;
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
          stream = completed.streamRows(limit ? { start: 0, end: limit - 1 } : undefined);
          stream
            .on('data', (row: Record<string, unknown>) => rows.push(convertRow(row, columns)))
            .on('error', reject)
            .on('end', () => resolve({ rows, columns: schema }));
        },
      });
    });

    const current = statement;
    if (current) this.running.set(current, stop);
    try {
      return await runWithTimeout(result, timeoutMs, {
        onTimeout: () => {
          const error = new SnowflakeQueryTimeoutError(timeoutMs);
          stop(error);
          current?.cancel(() => undefined);
          return error;
        },
        unref: true,
      });
    } finally {
      stopped = true;
      stream?.destroy();
      if (current) this.running.delete(current);
    }
  }
}
