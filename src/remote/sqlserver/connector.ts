/**
 * DBMS-agnostic query connector used by SqlServerEngine. Production uses the
 * tedious adapter; the mock adapter reproduces the same contract in memory so
 * unit tests and demos run without a live SQL Server.
 */
import type { ParsedProfileOptions, Profile, Schema, SqlServerSourceOptions } from '../../types';

/** Shape of a query result row; column values are the driver's native values. */
export type QueryResultRow = Record<string, unknown>;

/** A single result row's column metadata as reported by the server. */
export interface QueryColumnMeta {
  name: string;
  /** Native type name (e.g. `int`, `nvarchar`). */
  type: string;
}

/** Bounded result returned by a connector query. */
export interface QueryResult {
  columns: QueryColumnMeta[];
  rows: QueryResultRow[];
}

/** Lifecycle: connect/dispose plus read-only statement execution. */
export interface QueryConnector {
  connect(): Promise<void>;
  query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }>;
  /** Optional native profiling path used by the in-memory adapter. */
  profile?(schema: Schema, options: ParsedProfileOptions): Promise<Profile>;
  close(): Promise<void>;
}

/** Build the connector for the configured adapter. */
export async function createConnector(
  options: SqlServerSourceOptions
): Promise<QueryConnector> {
  if (options.adapter === 'mock') {
    const { MockQueryConnector } = await import('./mock');
    return new MockQueryConnector(options);
  }
  const { TediousQueryConnector } = await import('./tedious');
  return new TediousQueryConnector(options);
}