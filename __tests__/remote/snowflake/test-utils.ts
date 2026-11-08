/**
 * In-memory stand-in for the parts of snowflake-sdk the engine uses: connect/destroy callbacks,
 * execute() with a `complete` callback, and streamed rows bounded by streamRows({ start, end }).
 */
import { Readable } from 'stream';

import { vi } from 'vitest';

export interface FakeColumn {
  getName(): string;
  getType(): string;
  getScale(): number;
  getPrecision(): number;
}

export function column(name: string, type = 'text', precision = 38, scale = 0): FakeColumn {
  return { getName: () => name, getType: () => type, getScale: () => scale, getPrecision: () => precision };
}

export interface ExecuteOptions {
  sqlText: string;
  binds?: unknown[];
  describeOnly?: boolean;
  streamResult?: boolean;
  rowMode?: string;
  fetchAsString?: string[];
  parameters?: Record<string, unknown>;
  complete: (error: Error | undefined, statement: unknown) => void;
}

/** A statement result, an error, or 'hang' for a statement that never completes. */
export type Response = { columns?: FakeColumn[]; rows?: Record<string, unknown>[] } | { error: Error } | 'hang';

const CONTEXT_ROW = { database: 'ANALYTICS', schema: 'SALES', warehouse: 'AVA_WH', role: 'AVA_READER' };

/** Answer the load-time context check unless the test overrides it. */
export function contextResponse(row: Record<string, unknown> = CONTEXT_ROW): Response {
  return {
    columns: Object.keys(row).map((name) => column(name)),
    rows: [row],
  };
}

export function fakeConnection(respond: (options: ExecuteOptions) => Response | undefined) {
  const calls: ExecuteOptions[] = [];
  const statements: { cancel: ReturnType<typeof vi.fn> }[] = [];
  const connection = {
    connect: vi.fn((callback: (error: Error | undefined, connection: unknown) => void) => {
      setImmediate(() => callback(undefined, connection));
      return connection;
    }),
    destroy: vi.fn((callback: (error: Error | undefined, connection: unknown) => void) => {
      setImmediate(() => callback(undefined, connection));
    }),
    execute: vi.fn((options: ExecuteOptions) => {
      calls.push(options);
      const statement = { cancel: vi.fn((callback?: () => void) => setImmediate(() => callback?.())) };
      statements.push(statement);
      const response = /CURRENT_DATABASE\(\)/.test(options.sqlText)
        ? respond(options) ?? contextResponse()
        : respond(options) ?? { rows: [] };
      if (response !== 'hang') {
        setImmediate(() => {
          if ('error' in response) {
            options.complete(response.error, statement);
            return;
          }
          options.complete(undefined, {
            ...statement,
            getColumns: () => response.columns ?? [],
            streamRows: vi.fn(({ start = 0, end = Number.MAX_SAFE_INTEGER } = {}) =>
              Readable.from((response.rows ?? []).slice(start, end + 1).map((row) => ({ ...row })))
            ),
          });
        });
      }
      return statement;
    }),
  };
  return { connection, calls, statements };
}
