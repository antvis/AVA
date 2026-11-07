/**
 * Snowflake engine: schema discovery and read-only SQL execution
 * through a connector (the snowflake-sdk driver or the built-in in-memory mock).
 */
export { SnowflakeEngine } from './engine';
export { SNOWFLAKE_TABLE_SEED } from './examples';

export { validateReadOnlySnowflake, limitedSnowflakeQuery } from '../../query/snowflake';

export type { QueryConnector, QueryResult, QueryResultRow, QueryColumnMeta } from './connector';
export { MockQueryConnector } from './mock';
export { createConnector } from './connector';
