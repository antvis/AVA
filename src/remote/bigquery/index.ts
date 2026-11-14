/**
 * Google BigQuery engine: schema discovery and read-only GoogleSQL execution
 * through a connector (@google-cloud/bigquery driver or the built-in
 * in-memory mock).
 */
export { BigQueryEngine } from './engine';
export { BIGQUERY_TABLE_SEED } from './examples';

export { validateReadOnlyBigQuery } from '../../query/bigquery';

export type { QueryConnector, QueryLimits, QueryResult, QueryResultRow, QueryColumnMeta } from './connector';
export { MockQueryConnector } from './mock';
export { createConnector } from './connector';
export { BUILTIN_METRICS, profileTables, logicalType as bigQueryLogicalType } from './profile';