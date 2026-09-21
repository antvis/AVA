import type { ExecutionOptions, ExecutionResult, QueryColumn } from '../types';

const DEFAULT_MAX_ROWS = 200;
const MAX_ROWS = 10_000;

/**
 * Get the bounded maximum row count.
 */
export function maxRows(options: ExecutionOptions = {}): number {
  return Math.min(Math.max(options.maxRows ?? DEFAULT_MAX_ROWS, 1), MAX_ROWS);
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
  limit: number
): ExecutionResult<T> {
  return {
    data: rows.slice(0, limit),
    truncated: rows.length > limit,
    schema,
    rowCount: rows.length <= limit ? rows.length : undefined,
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
