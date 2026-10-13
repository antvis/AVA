/** Value coercion helpers for typed engine query results. */
import type { QueryColumn } from '../types';

const NUMERIC_TYPE = /^(U?(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT)|FLOAT|DOUBLE|REAL|DECIMAL(?:\(.*\))?)$/i;

/** Ignore decimal padding: "12.500" and "12.5" represent the same value. */
function trimDecimalZeros(value: string): string {
  return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function coerceNumericString(value: string): string | number {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;

  // JavaScript numbers cannot represent every integer outside the safe range.
  if (Number.isInteger(number) && !Number.isSafeInteger(number)) return value;

  // Keep the original when conversion rounds decimal digits or changes notation.
  // This is a conservative string round-trip check, not exact decimal arithmetic.
  if (trimDecimalZeros(String(number)) !== trimDecimalZeros(value)) return value;

  return number;
}

/** DuckDB serializes some numeric types as strings; text columns must remain text. */
export function coerceNumbers(rows: any[], schema: QueryColumn[]): any[] {
  const numericColumns = new Set(schema.filter(({ type }) => NUMERIC_TYPE.test(type ?? '')).map(({ name }) => name));

  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = typeof value === 'string' && numericColumns.has(key) ? coerceNumericString(value) : value;
    }
    return out;
  });
}
