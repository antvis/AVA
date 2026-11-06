/**
 * DBMS-agnostic query connector used by BigQueryEngine. Production uses the
 * `@google-cloud/bigquery` adapter; the mock adapter reproduces the same
 * contract in memory so unit tests and demos run without a live GCP project.
 */
import type { BigQuerySourceOptions, ParsedProfileOptions, Profile, Schema } from '../../types';

/** Shape of a query result row; column values are the driver's native values. */
export type QueryResultRow = Record<string, unknown>;

/** A single result row's column metadata as reported by the server. */
export interface QueryColumnMeta {
  name: string;
  /** Native type name (e.g. `INT64`, `STRING`). */
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
  close(): Promise<void>;
  /**
   * Optional in-memory profiling path. The mock connector evaluates metrics
   * directly over its seeded rows because it does not implement the full
   * GoogleSQL expression surface used by production profiling.
   */
  profile?(schema: Schema, options: ParsedProfileOptions): Promise<Profile>;
}

/** Build the connector for the configured adapter. */
export async function createConnector(options: BigQuerySourceOptions): Promise<QueryConnector> {
  if (options.adapter === 'mock') {
    const { MockQueryConnector } = await import('./mock');
    return new MockQueryConnector(options);
  }
  const { BigQueryQueryConnector } = await import('./bigquery-connector');
  return new BigQueryQueryConnector(options);
}