/**
 * SQL helpers for the DuckDB engine.
 */

import type { FileFormat } from '../types';

/** DuckDB reader function for each file format */
export const READ_FN: Record<FileFormat, string> = {
  csv: 'read_csv',
  json: 'read_json',
  parquet: 'read_parquet',
};

/** Escape a string for safe embedding in a SQL string literal */
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}
