import { coerceNumericString } from '../../util/coerce';

import type { Column } from 'snowflake-sdk';
import type { QueryColumn } from '../../contracts/result';

/** Snowflake type name of a result column, as written in DDL. */
function typeName(column: Column): string {
  const type = column.getType();
  if (type === 'fixed') return `NUMBER(${column.getPrecision()},${column.getScale()})`;
  if (type === 'real') return 'FLOAT';
  if (type === 'text') return 'VARCHAR';
  return type.toUpperCase();
}

/** Result column metadata; duplicate names carry the driver's `_2` suffix, matching the row keys. */
export function queryColumn(column: Column): QueryColumn {
  return { name: column.getName(), type: typeName(column) };
}

/** The driver returns structured MAPs as Map; normalize them before JSON output and byte limits. */
function convertMaps(value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries(Array.from(value, ([key, entry]) => [key, convertMaps(entry)]));
  }
  if (Array.isArray(value)) return value.map(convertMaps);
  if (value !== null && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, convertMaps(entry)]));
    }
  }
  return value;
}

/**
 * Numbers arrive as Snowflake's exact decimal text and become JavaScript numbers only when nothing is
 * lost; larger or more precise values stay strings. Non-finite floats (NaN, inf) also stay strings,
 * because JSON cannot represent them. Dates, times and binary values arrive as formatted strings, and
 * semi-structured values as parsed JSON.
 */
export function convertRow(row: Record<string, unknown>, columns: Column[]): Record<string, unknown> {
  for (const column of columns) {
    const name = column.getName();
    const value = row[name];
    if (typeof value !== 'string') {
      row[name] = convertMaps(value);
    } else if (column.getType() === 'fixed') {
      row[name] = coerceNumericString(value);
    } else if (column.getType() === 'real') {
      const number = Number(value);
      if (Number.isFinite(number)) row[name] = number;
    }
  }
  return row;
}
