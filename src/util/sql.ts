/**
 * SQL helpers for the DuckDB engine.
 */

import type { CSVReadOptions, FileFormat } from '../types';

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

/** Quote a value as a SQL string literal */
export function sqlStringLiteral(value: string): string {
  return `'${escapeSql(value)}'`;
}

/** Combine compatible queries with UNION ALL, preserving duplicate rows. */
export function sqlUnionAll(queries: readonly string[]): string {
  return queries.join('\nUNION ALL\n');
}

/** Quote a SQL identifier (database/schema/table name) */
export function sqlIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Serialize a single DuckDB reader option value (string/number/boolean/array/map) */
function serializeOptionValue(value: unknown): string | null {
  if (typeof value === 'string') return value.length > 0 ? sqlStringLiteral(value) : null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return `[${value.map(sqlStringLiteral).join(', ')}]`;
  }
  if (
    value &&
    typeof value === 'object' &&
    Object.values(value).every((item) => typeof item === 'string')
  ) {
    const entries = Object.entries(value as Record<string, string>).map(
      ([key, item]) => `${sqlStringLiteral(key)}: ${sqlStringLiteral(item)}`
    );
    return `{${entries.join(', ')}}`;
  }
  return null;
}

/**
 * Serialize DuckDB reader options into a `, key=value, ...` SQL fragment for
 * read_csv/read_json. Entries whose value cannot be serialized are skipped.
 */
export function serializeOptions(options?: CSVReadOptions): string {
  if (!options) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(options)) {
    const serialized = serializeOptionValue(value);
    if (serialized !== null) parts.push(`${key}=${serialized}`);
  }
  return parts.length > 0 ? `, ${parts.join(', ')}` : '';
}
