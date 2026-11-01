/**
 * GoogleSQL type names and JSON values for BigQuery REST schemas and rows.
 * https://cloud.google.com/bigquery/docs/reference/rest/v2/tables#TableFieldSchema
 */
import { bigQueryIdentifier } from '../../util/sql';

import type { Field, Row } from './api';
import type { LogicalType } from '../../types';

/** Legacy REST type names and their GoogleSQL equivalents. */
const TYPE_NAMES: Record<string, string> = { INTEGER: 'INT64', FLOAT: 'FLOAT64', BOOLEAN: 'BOOL', RECORD: 'STRUCT' };

function baseType(field: Field): string {
  return TYPE_NAMES[field.type] ?? field.type;
}

function fieldName(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : bigQueryIdentifier(name);
}

/** Render a field as a GoogleSQL type, e.g. `ARRAY<STRUCT<id INT64>>` or `NUMERIC(10, 2)`. */
export function fieldType(field: Field): string {
  const base = baseType(field);
  let type = base;
  if (base === 'STRUCT') {
    type = `STRUCT<${(field.fields ?? []).map((child) => `${fieldName(child.name)} ${fieldType(child)}`).join(', ')}>`;
  } else if (base === 'RANGE') {
    type = `RANGE<${field.rangeElementType?.type ?? 'UNKNOWN'}>`;
  } else if ((base === 'NUMERIC' || base === 'BIGNUMERIC') && field.precision) {
    type = `${base}(${field.precision}${field.scale ? `, ${field.scale}` : ''})`;
  } else if ((base === 'STRING' || base === 'BYTES') && field.maxLength) {
    type = `${base}(${field.maxLength})`;
  }
  return field.mode === 'REPEATED' ? `ARRAY<${type}>` : type;
}

/** Map a rendered GoogleSQL type to the profile type shared by all engines. */
export function logicalType(type: string): LogicalType {
  const base = type.replace(/\(.*\)$/, '');
  if (/^(?:INT64|FLOAT64|NUMERIC|BIGNUMERIC)$/.test(base)) return 'numeric';
  if (base === 'STRING') return 'string';
  if (base === 'BOOL') return 'boolean';
  if (/^(?:DATE|DATETIME|TIMESTAMP)$/.test(base)) return 'date';
  return 'unknown';
}

/** Sign, significant digits and decimal exponent of a decimal string, e.g. `-19.90` -> `-199e2`. */
function decimalKey(text: string): string | undefined {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match || !(match[2] || match[3])) return undefined;
  const digits = `${match[2]}${match[3] ?? ''}`;
  const significant = digits.replace(/^0+/, '');
  const exponent = Number(match[4] ?? 0) + match[2].length - (digits.length - significant.length);
  const trimmed = significant.replace(/0+$/, '');
  return trimmed ? `${match[1] === '-' ? '-' : ''}${trimmed}e${exponent}` : '0';
}

/** NUMERIC and BIGNUMERIC become numbers only when the conversion is exact. */
function exactNumber(text: string): number | string {
  const value = Number(text);
  return Number.isFinite(value) && decimalKey(String(value)) === decimalKey(text) ? value : text;
}

/** TIMESTAMP as ISO 8601 UTC with microsecond precision, from int64 microseconds or float seconds. */
function timestamp(text: string): string {
  let micros = text;
  if (!/^-?\d+$/.test(micros)) {
    const seconds = Number(micros);
    if (!Number.isFinite(seconds)) return text;
    micros = String(Math.round(seconds * 1e6));
  }
  const negative = micros.startsWith('-');
  const digits = (negative ? micros.slice(1) : micros).padStart(7, '0');
  let seconds = Number(digits.slice(0, -6));
  let fraction = Number(digits.slice(-6));
  if (negative) {
    seconds = -seconds;
    if (fraction) {
      seconds -= 1;
      fraction = 1_000_000 - fraction;
    }
  }
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return text;
  const decimals = String(fraction).padStart(6, '0').replace(/0+$/, '');
  return `${date.toISOString().slice(0, 19)}${decimals ? `.${decimals}` : ''}Z`;
}

/** Convert one REST cell value: arrays arrive as `[{ v }]`, structs as `{ f: [{ v }] }`, scalars as strings. */
function fieldValue(field: Field, value: unknown, repeated = field.mode === 'REPEATED'): unknown {
  if (repeated) {
    // BigQuery has no NULL arrays; an absent array reads as empty.
    return (Array.isArray(value) ? value : []).map((cell: { v: unknown }) => fieldValue(field, cell?.v, false));
  }
  if (value === null || value === undefined) return null;
  const type = baseType(field);
  if (type === 'STRUCT') {
    const record: Record<string, unknown> = {};
    (field.fields ?? []).forEach((child, index) => {
      record[child.name] = fieldValue(child, (value as Row).f?.[index]?.v);
    });
    return record;
  }
  const text = String(value);
  switch (type) {
    case 'INT64': {
      const number = Number(text);
      return Number.isSafeInteger(number) ? number : text;
    }
    case 'FLOAT64': {
      // NaN and ±Infinity have no JSON number form and stay as BigQuery spells them.
      const number = Number(text);
      return Number.isFinite(number) ? number : text;
    }
    case 'NUMERIC':
    case 'BIGNUMERIC':
      return exactNumber(text);
    case 'BOOL':
      return text === 'true';
    case 'TIMESTAMP':
      return timestamp(text);
    case 'JSON':
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    default:
      // STRING, BYTES (base64), DATE, DATETIME, TIME, GEOGRAPHY (WKT), INTERVAL and RANGE keep
      // BigQuery's canonical text.
      return text;
  }
}

/**
 * Convert a REST row to a JSON object keyed by field name.
 * INT64 beyond Number.MAX_SAFE_INTEGER and inexact NUMERIC values stay strings.
 */
export function rowObject(fields: Field[], row: Row): Record<string, unknown> {
  return fieldValue({ name: '', type: 'STRUCT', fields }, row ?? { f: [] }) as Record<string, unknown>;
}
