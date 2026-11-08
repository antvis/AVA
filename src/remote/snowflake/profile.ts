import { column, logicalTypes, table, TOP_VALUES_OPTIONS, resolveMetric } from '../../util/profile';
import { sqlIdentifier } from '../../util/sql';

import type { MetricField, Metric } from '../../util/profile';
import type { LogicalType, ParsedProfileOptions, Profile } from '../../contracts/profile';
import type { Schema } from '../../contracts/schema';

interface Context {
  table: string;
  column?: string;
  field?: MetricField;
  metric: ParsedProfileOptions['metrics'][number];
}

type SnowflakeMetric = Metric<(context: Context) => string>;

/** Map a Snowflake type (with or without its parameters) to the shared logical type. */
export function logicalType(type: string): LogicalType {
  const base = type
    .trim()
    .replace(/\s*\(.*\)$/, '')
    .toUpperCase();
  if (
    /^(?:NUMBER|DECIMAL|NUMERIC|DECFLOAT|INT|INTEGER|BIGINT|SMALLINT|TINYINT|BYTEINT|FLOAT[48]?|DOUBLE(?: PRECISION)?|REAL)$/.test(
      base
    )
  ) {
    return 'numeric';
  }
  if (/^(?:VARCHAR|N?CHAR(?:ACTER)?(?: VARYING)?|NVARCHAR2?|STRING|TEXT)$/.test(base)) return 'string';
  if (base === 'BOOLEAN') return 'boolean';
  if (/^(?:DATE|DATETIME|TIMESTAMP(?:_LTZ|_NTZ|_TZ)?)$/.test(base)) return 'date';
  return 'unknown';
}

/**
 * Dates and timestamps are reported as Unix milliseconds; DATE and TIMESTAMP_NTZ values are read as
 * UTC. EPOCH_MILLISECOND applies to timestamps only, so a DATE is cast first.
 */
function bound(fn: 'MIN' | 'MAX', { column, field }: Context): string {
  if (field!.logicalType !== 'date') return `${fn}(${column})`;
  const value = /^DATE$/i.test(field!.type.trim()) ? `${fn}(${column})::TIMESTAMP_NTZ` : `${fn}(${column})`;
  return `DATE_PART(EPOCH_MILLISECOND, ${value})`;
}

export const BUILTIN_METRICS: SnowflakeMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT(*) - COUNT(${column})` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column})`,
  },
  // Snowflake compares every type, including VARIANT, GEOGRAPHY and VECTOR, so no cast is needed
  // (TO_VARCHAR rejects GEOGRAPHY, VECTOR and MAP values).
  { id: 'duplicate_count', enable: column, expression: ({ column }) => `COUNT(${column}) - COUNT(DISTINCT ${column})` },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      // ARRAY_AGG returns [] for no rows, so JSON distinguishes an empty list from an omitted metric.
      return `CASE WHEN COUNT(DISTINCT ${column}) > COUNT(*) * ${maxDistinctRatio} THEN NULL ELSE (
        SELECT ARRAY_AGG(OBJECT_CONSTRUCT('value', "value", 'count', "count")) WITHIN GROUP (ORDER BY "count" DESC, "value")
        FROM (SELECT ${column} AS "value", COUNT(*) AS "count" FROM ${table}
          WHERE ${column} IS NOT NULL GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT ${limit})) END`;
    },
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: (context) => bound('MIN', context) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: (context) => bound('MAX', context) },
  { id: 'min_length', enable: logicalTypes('string'), expression: ({ column }) => `MIN(LENGTH(${column}))` },
  { id: 'max_length', enable: logicalTypes('string'), expression: ({ column }) => `MAX(LENGTH(${column}))` },
  { id: 'mean', enable: logicalTypes('numeric'), expression: ({ column }) => `AVG(${column})` },
  { id: 'sum', enable: logicalTypes('numeric'), expression: ({ column }) => `SUM(${column})` },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: ({ column }) => `STDDEV_SAMP(${column})` },
  { id: 'median', enable: logicalTypes('numeric'), expression: ({ column }) => `MEDIAN(${column})` },
];

function parseTopValues(raw: unknown): Array<{ value: unknown; count: number }> {
  if (!Array.isArray(raw)) throw new Error('Invalid Snowflake top_values result');
  return raw.map((entry: unknown) => {
    const { value, count } = (entry ?? {}) as { value?: unknown; count?: unknown };
    if (value === undefined || count == null || !Number.isFinite(Number(count))) {
      throw new Error('Invalid Snowflake top_values entry');
    }
    return { value, count: Number(count) };
  });
}

/** Qualify the table with its catalog and schema so profiling does not depend on the session default. */
function tableName({ tableReference }: Schema['models'][number]): string {
  const { catalog, schema, table } = tableReference;
  return [catalog, schema, table]
    .filter((part): part is string => part != null)
    .map(sqlIdentifier)
    .join('.');
}

/** One aggregate query per table computes all selected metrics. */
export async function profileTables(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));
  const models: Profile['models'] = [];
  for (const source of schema.models) {
    const profile: Profile['models'][number] = {
      name: source.name,
      metrics: {},
      columns: [],
    };
    models.push(profile);
    const pending: { expression: string; id: string; output: Record<string, unknown> }[] = [];
    const table = tableName(source);
    const add = (output: Record<string, unknown>, field?: MetricField) => {
      for (const { metric, definition } of metrics) {
        if (!definition.enable({ target: field ? 'column' : 'table', field })) continue;
        pending.push({
          id: metric.id,
          output,
          expression: definition.expression({
            table,
            column: field ? sqlIdentifier(field.name) : undefined,
            field,
            metric,
          }),
        });
      }
    };
    add(profile.metrics);
    profile.columns = source.columns.map((column) => {
      const field = { ...column, logicalType: logicalType(column.type) };
      const metrics = {};
      add(metrics, field);
      return { name: field.name, properties: { logicalType: field.logicalType }, metrics };
    });
    if (!pending.length) continue;
    const [row] = await runQuery(
      `SELECT ${pending
        .map(({ expression }, i) => `${expression} AS ${sqlIdentifier(`m${i}`)}`)
        .join(', ')} FROM ${table}`
    );
    if (!row) throw new Error(`Missing profile result for table: ${source.name}`);
    pending.forEach(({ id, output }, i) => {
      const raw = row[`m${i}`];
      delete output[id];
      if (id === 'top_values') {
        if (raw != null) output[id] = parseTopValues(raw);
      } else {
        const value = raw == null ? null : Number(raw);
        output[id] = value === null || Number.isFinite(value) ? value : null;
      }
    });
  }
  return { models };
}
