import { sqlStringLiteral } from '../util/sql';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { LogicalType, ProfileOptions, ProfileType } from '../types';

type Field = { name: string; value: string; logicalType: LogicalType };

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
): Promise<Map<string, ProfileType>> {
  const inferred = new Map<string, ProfileType>();
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
        ]
      : []),
  ]);
  const row = (await connection.runAndReadAll(`SELECT ${projection.join(', ')} FROM ${table}`)).getRowObjectsJson()[0];
  const { numericCategoryThreshold = 5, textCategoryThreshold = 50, textCategoryRatio = 0.5 } = options;
  for (const [i, { name, logicalType }] of fields.entries()) {
    const count = Number(row[`n${i}`]);
    const distinct = Number(row[`d${i}`]);
    if (!count || logicalType === 'unknown') inferred.set(name, 'Unsupported');
    else if (logicalType === 'boolean') inferred.set(name, 'Boolean');
    else if (logicalType === 'date') inferred.set(name, 'DateTime');
    else if (row[`b${i}`]) inferred.set(name, 'Boolean');
    else if (logicalType === 'numeric') {
      inferred.set(name, distinct <= numericCategoryThreshold ? 'Categorical' : 'Numeric');
    } else {
      const categorical =
        distinct <= textCategoryThreshold && (textCategoryRatio > 1 || distinct / count < textCategoryRatio);
      inferred.set(name, categorical ? 'Categorical' : 'Text');
    }
  }
  return inferred;
}
