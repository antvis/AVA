/**
 * DuckDB engine: SQL analysis over in-memory DuckDB (Node.js only).
 */
export { DuckDBEngine, generateSQL } from './engine';
export { loadSource } from './loaders';
export type { LoadedSource } from './loaders';
export { extractMetadata, formatDatasetInfo, formatDatasetInfoWithNonArray } from './metadata';
