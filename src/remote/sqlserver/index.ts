/**
 * Microsoft SQL Server engine: schema discovery and read-only T-SQL execution
 * through a connector (tedious driver or the built-in in-memory mock).
 */
export {
  SqlServerEngine,
} from './engine';
export { SQLSERVER_TABLE_SEED } from './examples';

export {
  validateReadOnlySqlServer,
  limitedTsqlQuery,
} from '../../query/sqlserver';

export type { QueryConnector, QueryResult, QueryResultRow, QueryColumnMeta } from './connector';
export { MockQueryConnector } from './mock';
export { createConnector } from './connector';