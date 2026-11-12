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

export function wordCountsSql(
  table: string,
  column: string,
  lowercase: string,
  stopWords: string[],
  limit?: number
): string {
  if (limit === 0) return 'COALESCE(first(NULL), [])';
  const word = `trim(token, ${punctuation})`;
  const normalized = `CASE WHEN strlen(text) = length(text) THEN lower(text) ELSE ${lowercase}(text) END`;
  const stops = stopWords.length
    ? `AND ${word} NOT IN (${stopWords.map((value) => sqlStringLiteral(value.toLowerCase())).join(', ')})`
    : '';
  const top = limit === undefined ? '' : `ORDER BY n DESC, word LIMIT ${limit}`;
  // Count identical strings once and carry their weights through token aggregation.
  return `COALESCE(first((SELECT list(struct_pack(value := word, count := n) ORDER BY n DESC, word)
    FROM (SELECT ${word} AS word, sum(weight)::DOUBLE AS n
      FROM (SELECT CAST(${column} AS VARCHAR) AS text, count(*) AS weight
        FROM ${table} WHERE ${column} IS NOT NULL GROUP BY 1) weighted
      CROSS JOIN unnest(regexp_split_to_array(${normalized}, ${whitespace})) tokens(token)
      WHERE token <> '' ${stops} GROUP BY word ${top}) frequencies)), [])`;
}
