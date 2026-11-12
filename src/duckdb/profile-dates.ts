import { sqlStringLiteral } from '../util/sql';

const formats = [
  '%Y/%m/%d',
  '%Y.%m.%d',
  '%m/%d/%Y',
  '%d/%m/%Y',
  '%m-%d-%Y',
  '%d-%m-%Y',
  '%d-%b-%Y',
  '%d %b %Y',
  '%d %B %Y',
  '%b %d, %Y',
  '%B %d, %Y',
  '%b %d %Y',
  '%B %d %Y',
  '%Y%m%d',
  '%Y-%m',
  '%Y',
];

export function parseDateSql(column: string): string {
  const text = `trim(CAST(${column} AS VARCHAR))`;
  const parsed = `coalesce(try_cast(${text} AS TIMESTAMPTZ),
    timezone('UTC', try_strptime(${text}, [${formats.map(sqlStringLiteral).join(', ')}])))`;
  return `list_transform([${parsed}], lambda parsed:
    CASE WHEN parsed BETWEEN TIMESTAMPTZ '1677-09-21 00:12:43.145225+00'
      AND TIMESTAMPTZ '2262-04-11 23:47:16.854775+00' THEN parsed END)[1]`;
}

export function dateValidationSql(column: string, nativeDate: boolean): string {
  const invalid = nativeDate
    ? `NOT isfinite(${column})`
    : `${column} IS NOT NULL AND (${parseDateSql(column)}) IS NULL`;
  const count = `count(*) FILTER (WHERE ${invalid})`;
  return `struct_pack(invalid_dates := (count(DISTINCT ${column}) FILTER (WHERE ${invalid}))::DOUBLE,
    n_invalid_dates := (${count})::DOUBLE,
    p_invalid_dates := coalesce((${count})::DOUBLE / nullif(count(*), 0), 0))`;
}
