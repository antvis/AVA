/**
 * Value coercion helpers for engine query results.
 */

/**
 * DuckDB JSON rows serialize BIGINT/DECIMAL as strings — coerce numeric strings
 * back to numbers. Strings with leading zeros ("007") are left untouched.
 */
export function coerceNumbers(rows: any[]): any[] {
  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = typeof value === 'string' && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) ? Number(value) : value;
    }
    return out;
  });
}
