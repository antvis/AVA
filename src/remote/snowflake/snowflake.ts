/**
 * Snowflake connector built on the `snowflake-sdk` driver. Statements run on
 * the configured database/schema after local read-only validation. That
 * validation is defense-in-depth, not a privilege boundary: production users
 * must configure a restricted role with only the required read privileges.
 *
 * The snowflake-sdk package is loaded lazily through a Node-compatible
 * `createRequire` function so both the CommonJS and ES module builds work even
 * where the driver is optional.
 */
import { createRequire } from 'node:module';

import { resolveSnowflakeConfig } from './snowflake-config';

import type { SnowflakeSDKSourceOptions } from '../../types';
import type { QueryColumnMeta, QueryConnector, QueryResult, QueryResultRow } from './connector';

/** Structural subset of the snowflake-sdk connection object. */
interface SnowflakeConnection {
  connect(cb: (err?: unknown, conn?: unknown) => void): void;
  execute(options: {
    sqlText: string;
    binds?: unknown[];
    complete: (err?: unknown, stmt?: unknown, rows?: Record<string, unknown>[]) => void;
  }): void;
  destroy(cb: (err?: unknown) => void): void;
  isValidAsync(): Promise<boolean>;
}

interface SnowflakeModule {
  createConnection(config: unknown): SnowflakeConnection;
}

const moduleRequire = createRequire(
  // `import.meta.url` cannot be shared by the project's CommonJS and ES2020
  // TypeScript builds. Use the real module path in CJS and an absolute fallback
  // in ESM; neither form evaluates a bare `require` in an ES module.
  typeof __filename === 'string' ? __filename : `${process.cwd()}/package.json`
);

let cachedModule: SnowflakeModule | undefined;

function isMissingSnowflakeSdk(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof message !== 'string') return false;
  return (
    (code === 'MODULE_NOT_FOUND' && message.startsWith("Cannot find module 'snowflake-sdk'")) ||
    (code === 'ERR_MODULE_NOT_FOUND' && message.startsWith("Cannot find package 'snowflake-sdk'"))
  );
}

/** Load (and cache) the snowflake-sdk bindings, throwing a clear error only when the SDK itself is absent. */
function loadSnowflake(): SnowflakeModule {
  if (cachedModule) return cachedModule;
  try {
    cachedModule = moduleRequire('snowflake-sdk') as SnowflakeModule;
  } catch (error) {
    if (!isMissingSnowflakeSdk(error)) throw error;
    throw new Error(
      'Snowflake adapter requires the optional "snowflake-sdk" dependency. ' +
        'Install it (npm i snowflake-sdk) or set adapter: "mock" to use the in-memory connector.'
    );
  }
  return cachedModule;
}

export class SnowflakeQueryConnector implements QueryConnector {
  private readonly options: SnowflakeSDKSourceOptions;
  private connection: SnowflakeConnection | null = null;

  constructor(options: SnowflakeSDKSourceOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.connection) {
      // Re-connect if the session has been invalidated.
      const valid = await this.connection.isValidAsync().catch(() => false);
      if (valid) return;
      await this.close();
    }

    const config = resolveSnowflakeConfig(this.options);
    const { createConnection } = loadSnowflake();
    const connection = createConnection(config);

    const err = await new Promise<unknown>((resolve) => {
      connection.connect((error) => resolve(error));
    });

    if (err) {
      throw new Error(`Failed to connect to Snowflake: ${String((err as Error)?.message ?? err)}`);
    }
    this.connection = connection;
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    const connection = this.connection!;

    return new Promise<QueryResult & { rows: T[] }>((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        complete: (err, _stmt, rows) => {
          if (err) {
            reject(err instanceof Error ? err : new Error(String((err as { message?: string })?.message ?? err)));
            return;
          }
          const resultRows = (rows ?? []) as T[];
          const columns: QueryColumnMeta[] =
            resultRows.length > 0 ? Object.keys(resultRows[0]).map((name) => ({ name, type: 'unknown' })) : [];
          resolve({ columns, rows: resultRows });
        },
      });
    });
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    const connection = this.connection;
    this.connection = null;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      try {
        connection.destroy(() => finish());
      } catch {
        finish();
      }
    });
  }
}
