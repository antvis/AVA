import { sqlStringLiteral } from '../util/sql';

import { parseDateSql } from './profile-dates';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { LogicalType, ProfileOptions, ProfileType } from '../types';

type Field = { name: string; value: string; logicalType: LogicalType };
type InferredType = { profileType: ProfileType; cast?: 'BIGINT' | 'UBIGINT' | 'DOUBLE' | 'TIMESTAMPTZ' };

export function numericTextSql(value: string, type: string): string {
  const text = `CAST(${value} AS VARCHAR)`;
  return `(CASE WHEN NOT contains(${text}, '_') THEN try_cast(${text} AS ${type}) END)`;
}

function dateTextCondition(value: string): string {
  const text = `trim(CAST(${value} AS VARCHAR))`;
  const parsed = `(CASE WHEN regexp_matches(${text}, '[0-9]') THEN ${parseDateSql(text)} END)`;
  const invalid = `${value} IS NOT NULL AND ${parsed} IS NULL AND lower(${text}) NOT IN ('', 'nat', 'nan')`;
  return `count(*) FILTER (WHERE ${invalid}) = 0
    AND count(*) FILTER (WHERE ${parsed} IS NOT NULL AND try_cast(${text} AS DOUBLE) IS NULL) > 0`;
}

export function booleanSql(value: string, mappings?: Record<string, boolean>, lowercase?: string): string {
  const configured = mappings ?? {
    t: true,
    f: false,
    yes: true,
    no: false,
    y: true,
    n: false,
    true: true,
    false: false,
  };
  const branches = Object.entries(configured).map(([name, value]) => `WHEN ${sqlStringLiteral(name)} THEN ${value}`);
  const text = `CAST(${value} AS VARCHAR)`;
  const normalized = lowercase
    ? `CASE WHEN strlen(${text}) = length(${text}) THEN lower(${text}) ELSE ${lowercase}(${text}) END`
    : `lower(${text})`;
  return branches.length ? `(CASE (${normalized}) ${branches.join(' ')} END)` : 'NULL::BOOLEAN';
}

export async function inferColumnTypes(
  connection: DuckDBConnection,
  table: string,
  fields: Field[],
  options: NonNullable<ProfileOptions['inferTypes']>,
  lowercase?: string
): Promise<Map<string, InferredType>> {
  const inferred = new Map<string, InferredType>();
  if (!fields.length) return inferred;
  const projection = fields.flatMap(({ value, logicalType }, i) => [
    `count(${value})::DOUBLE AS n${i}`,
    ...(logicalType === 'numeric' || logicalType === 'string' ? [`count(DISTINCT ${value})::DOUBLE AS d${i}`] : []),
    ...(logicalType === 'string'
      ? [
          `count(*) FILTER (WHERE ${value} IS NOT NULL AND ${booleanSql(
            value,
            options.booleanMappings,
            lowercase
          )} IS NULL) = 0 AS b${i}`,
          `count(*) FILTER (WHERE ${value} IS NOT NULL AND try_cast(${value} AS DOUBLE) IS NULL) = 0
            AND count(*) FILTER (WHERE NOT isnan(${numericTextSql(value, 'DOUBLE')})) > 0 AS x${i}`,
          `count(*) FILTER (WHERE ${value} IS NOT NULL AND (NOT regexp_full_match(trim(CAST(${value} AS VARCHAR)), '[+-]?[0-9]+')
            OR try_cast(${value} AS BIGINT) IS NULL)) = 0 AS i${i}`,
          `count(*) FILTER (WHERE ${value} IS NOT NULL AND (NOT regexp_full_match(trim(CAST(${value} AS VARCHAR)), '[+]?[0-9]+')
            OR try_cast(${value} AS UBIGINT) IS NULL)) = 0 AS u${i}`,
          `(${dateTextCondition(value)}) AS t${i}`,
        ]
      : []),
  ]);
  const row = (await connection.runAndReadAll(`SELECT ${projection.join(', ')} FROM ${table}`)).getRowObjectsJson()[0];
  const { numericCategoryThreshold = 5, textCategoryThreshold = 50, textCategoryRatio = 0.5 } = options;
  for (const [i, { name, logicalType }] of fields.entries()) {
    const count = Number(row[`n${i}`]);
    const distinct = Number(row[`d${i}`]);
    if (!count || logicalType === 'unknown') inferred.set(name, { profileType: 'Unsupported' });
    else if (logicalType === 'boolean') inferred.set(name, { profileType: 'Boolean' });
    else if (logicalType === 'date') inferred.set(name, { profileType: 'DateTime' });
    else if (row[`b${i}`]) inferred.set(name, { profileType: 'Boolean' });
    else if (logicalType === 'numeric') {
      inferred.set(name, { profileType: distinct <= numericCategoryThreshold ? 'Categorical' : 'Numeric' });
    } else if (row[`x${i}`] && distinct > numericCategoryThreshold) {
      inferred.set(name, {
        profileType: 'Numeric',
        cast: row[`i${i}`] ? 'BIGINT' : row[`u${i}`] ? 'UBIGINT' : 'DOUBLE',
      });
    } else if (row[`t${i}`]) {
      inferred.set(name, { profileType: 'DateTime', cast: 'TIMESTAMPTZ' });
    } else {
      const categorical =
        distinct <= textCategoryThreshold && (textCategoryRatio > 1 || distinct / count < textCategoryRatio);
      inferred.set(name, { profileType: categorical ? 'Categorical' : 'Text' });
    }
  }
  return inferred;
}
