import { utf8ByteLength } from './bytes';

import type { ExecutionOptions, ExecutionResult, QueryColumn } from '../types';

const DEFAULT_MAX_ROWS = 200;
const MAX_ROWS = 10_000;
const DEFAULT_MAX_RESULT_BYTES = 1024 * 1024; // 1M
const MAX_FIELD_BYTES = 1024 * 1024; // 1M

/**
 * Get the bounded maximum row count.
 */
export function maxRows(options: ExecutionOptions = {}): number {
  return Math.min(Math.max(options.maxRows ?? DEFAULT_MAX_ROWS, 1), MAX_ROWS);
}

/**
 * Get the bounded maximum serialized result size.
 */
export function maxResultBytes(options: ExecutionOptions = {}): number {
  const value = options.maxResultBytes ?? DEFAULT_MAX_RESULT_BYTES;
  return Number.isFinite(value) ? Math.max(Math.floor(value), 1) : DEFAULT_MAX_RESULT_BYTES;
}

function serializedBytes(value: unknown): number {
  return utf8ByteLength(JSON.stringify(value) ?? '');
}

/**
 * Create a SQL query with a row limit.
 */
export function limitedQuery(sql: string, limit: number): string {
  const query = sql.trim().replace(/;+\s*$/, '');
  return `SELECT * FROM (\n${query}\n) AS __ava_query LIMIT ${limit + 1}`;
}

/**
 * Create a bounded execution result.
 */
export function executionResult<T>(
  rows: T[],
  schema: QueryColumn[],
  options: ExecutionOptions = {}
): ExecutionResult<T> {
  const limit = maxRows(options);
  const limitedRows = rows.slice(0, limit);

  const maxBytes = maxResultBytes(options);
  const data: T[] = [];
  let bytes = 0;
  let truncatedBy: ExecutionResult<T>['truncatedBy'];

  for (const row of limitedRows) {
    const fields = row !== null && typeof row === 'object' && !Array.isArray(row) ? Object.values(row) : [row];
    if (fields.some((field) => serializedBytes(field) > MAX_FIELD_BYTES)) {
      throw new Error('Result field exceeds the 1 MiB limit');
    }

    const rowBytes = serializedBytes(row);
    if (bytes + rowBytes > maxBytes) {
      truncatedBy = 'maxResultBytes';
      break;
    }
    data.push(row);
    bytes += rowBytes;
  }

  truncatedBy ??= rows.length > limit ? 'maxRows' : undefined;
  return {
    data,
    ...(truncatedBy ? { truncated: true as const, truncatedBy } : {}),
    schema,
    rowCount: truncatedBy ? undefined : data.length,
  };
}

/**
 * Infer column metadata from result rows.
 */
export function inferQuerySchema(rows: unknown[]): QueryColumn[] {
  const row = rows[0];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
  return Object.entries(row).map(([name, value]) => ({
    name,
    type: value === null ? undefined : Array.isArray(value) ? 'array' : typeof value,
  }));
}
