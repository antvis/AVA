import { randomUUID } from 'node:crypto';

import { DuckDBScalarFunction, VARCHAR } from '@duckdb/node-api';

import { sqlStringLiteral } from '../util/sql';

import type { DuckDBConnection } from '@duckdb/node-api';

const lowercaseFunctions = new WeakMap<DuckDBConnection, string>();
const whitespace = sqlStringLiteral(
  '[\\x{0009}-\\x{000D}\\x{001C}-\\x{0020}\\x{0085}\\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}]+'
);
const punctuation = sqlStringLiteral('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');

export function registerWordLowercase(connection: DuckDBConnection): string {
  const existing = lowercaseFunctions.get(connection);
  if (existing) return existing;

  const name = `__ava_profile_lower_${randomUUID().replace(/-/g, '')}`;
  // Unicode full casing expands characters such as İ and handles Greek final sigma.
  const scalar = DuckDBScalarFunction.create({
    name,
    parameterTypes: [VARCHAR],
    returnType: VARCHAR,
    mainFunction: (_, input, output) => {
      const vector = input.getColumnVector(0);
      for (let row = 0; row < input.rowCount; row += 1) {
        const value = vector.getItem(row) as string | null;
        output.setItem(row, value?.toLowerCase() ?? null);
      }
      output.flush();
    },
  });
  try {
    connection.registerScalarFunction(scalar);
  } finally {
    scalar.destroySync();
  }
  lowercaseFunctions.set(connection, name);
  return name;
}

function textCountsSql(
  table: string,
  column: string,
  { tokens, value, filter = '', limit }: { tokens: string; value: string; filter?: string; limit?: number }
): string {
  if (limit === 0) return 'COALESCE(first(NULL), [])';
  const top = limit === undefined ? '' : `ORDER BY n DESC, symbol LIMIT ${limit}`;
  // Count identical strings once and carry their weights through token aggregation.
  return `COALESCE(first((SELECT list(struct_pack(value := symbol, count := n) ORDER BY n DESC, symbol)
    FROM (SELECT ${value} AS symbol, sum(weight)::DOUBLE AS n
      FROM (SELECT CAST(${column} AS VARCHAR) AS text, count(*) AS weight
        FROM ${table} WHERE ${column} IS NOT NULL GROUP BY 1) weighted
      CROSS JOIN unnest(${tokens}) tokens(token)
      WHERE token <> '' ${filter} GROUP BY symbol ${top}) frequencies)), [])`;
}

export function wordCountsSql(
  table: string,
  column: string,
  lowercase: string,
  stopWords: string[],
  limit?: number
): string {
  const value = `trim(token, ${punctuation})`;
  const normalized = `CASE WHEN strlen(text) = length(text) THEN lower(text) ELSE ${lowercase}(text) END`;
  const filter = stopWords.length
    ? `AND ${value} NOT IN (${stopWords.map((word) => sqlStringLiteral(word.toLowerCase())).join(', ')})`
    : '';
  return textCountsSql(table, column, {
    tokens: `regexp_split_to_array(${normalized}, ${whitespace})`,
    value,
    filter,
    limit,
  });
}

export function characterCountsSql(table: string, column: string): string {
  return textCountsSql(table, column, { tokens: "string_split(text, '')", value: 'token' });
}

export function lengthCountsSql(column: string): string {
  return `COALESCE(list_transform(map_entries(histogram(length(CAST(${column} AS VARCHAR)))),
      lambda entry: struct_pack(length := struct_extract(entry, 'key')::DOUBLE,
        count := struct_extract(entry, 'value')::DOUBLE)), [])`;
}

export function referenceMedianLength(histogram: { length: number; count: number }[]): number | null {
  if (!histogram.length) return null;
  const midpoint = histogram.reduce((total, { count }) => total + count, 0) / 2;
  // The reference sorts the weights independently of the lengths for this statistic.
  const weights = histogram.map(({ count }) => count).sort((a, b) => a - b);
  const maximum = weights[weights.length - 1];
  if (maximum > midpoint) return histogram.find(({ count }) => count === maximum)!.length;
  let total = 0;
  for (let i = 0; i < weights.length; i += 1) {
    total += weights[i];
    if (total === midpoint) return (histogram[i].length + histogram[i + 1].length) / 2;
    if (total > midpoint) return histogram[i].length;
  }
  return null;
}
