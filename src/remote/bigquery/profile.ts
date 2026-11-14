/**
 * BigQuery profiling. Each metric compiles to read-only GoogleSQL that the
 * engine batches into one aggregate query per table. Numeric results are
 * trimmed with a bounded float, and `top_values` is packed into a JSON string
 * (mirroring the SQL Server engine) that this module parses back.
 */
import { column, logicalTypes, table, TOP_VALUES_OPTIONS, resolveMetric } from '../../util/profile';

import type { MetricField } from '../../util/profile';
import type { LogicalType, Metric, ParsedProfileOptions, Profile, Schema } from '../../types';

interface Context {
  table: string;
  column?: string;
  field?: MetricField;
  metric: ParsedProfileOptions['metrics'][number];
}

type BigQueryMetric = Metric<(context: Context) => string>;

/** Escape a GoogleSQL identifier; double quotes denote strings, not identifiers. */
function sqlIdentifier(value: string): string {
  return `\`${value.replace(/`/g, '``')}\``;
}

/** BigQuery legacy/standard data type to AVA logical type. */
export function logicalType(type: string): LogicalType {
  const base = type.trim().toLowerCase();
  if (
    /^(?:int64|integer|int|smallint|bigint|tinyint|byteint|numeric|bignumeric|decimal|bignumeric\(.*\)|float|float64|double|doubleprecision|real)$/.test(
      base
    )
  )
    return 'numeric';
  // JSON/ARRAY/STRUCT are not groupable in BigQuery; leave them unknown so
  // default DISTINCT metrics are not generated for them.
  if (/^(string|bytes)$/.test(base)) return 'string';
  if (/^bool(?:ean)?$/.test(base)) return 'boolean';
  if (/^(?:date|datetime|timestamp|time)$/.test(base)) return 'date';
  return 'unknown';
}

/** Epoch-milliseconds expression for a temporal column. */
function epochMs(column: string, type?: string): string {
  const base = (type ?? '').toLowerCase();
  if (/^(?:date|datetime)$/.test(base)) return `UNIX_MILLIS(CAST(${column} AS TIMESTAMP))`;
  if (/^time$/.test(base)) {
    // EXTRACT(MICROSECOND) is only the fractional-second component, so include
    // every larger TIME part to measure the full offset from midnight.
    return `(EXTRACT(HOUR FROM ${column}) * 3600000 + EXTRACT(MINUTE FROM ${column}) * 60000 + EXTRACT(SECOND FROM ${column}) * 1000 + EXTRACT(MICROSECOND FROM ${column}) / 1000)`;
  }
  return `UNIX_MILLIS(${column})`;
}

function numericValue(column: string): string {
  return `CAST(${column} AS FLOAT64)`;
}

export const BUILTIN_METRICS: BigQueryMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNTIF(${column!} IS NULL)` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column!})`,
  },
  {
    id: 'duplicate_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(${column!}) - COUNT(DISTINCT ${column!})`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      const value = `CAST(${column!} AS STRING)`;
      return `CASE WHEN COUNT(DISTINCT ${value}) > COUNT(*) * ${maxDistinctRatio}
        THEN NULL ELSE (
          SELECT TO_JSON_STRING(COALESCE(ARRAY_AGG(STRUCT(value, count)), []))
          FROM (
            SELECT ${value} AS value, COUNT(*) AS count
            FROM ${table}
            WHERE ${column!} IS NOT NULL
            GROUP BY value
            ORDER BY count DESC, value ASC
            LIMIT ${limit}
          )
        ) END`;
    },
  },
  {
    id: 'min',
    enable: logicalTypes('numeric', 'date'),
    expression: ({ column, field }) =>
      field!.logicalType === 'date' ? `MIN(${epochMs(column!, field!.type)})` : `MIN(${numericValue(column!)})`,
  },
  {
    id: 'max',
    enable: logicalTypes('numeric', 'date'),
    expression: ({ column, field }) =>
      field!.logicalType === 'date' ? `MAX(${epochMs(column!, field!.type)})` : `MAX(${numericValue(column!)})`,
  },
  {
    id: 'min_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MIN(LENGTH(${column!}))`,
  },
  {
    id: 'max_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MAX(LENGTH(${column!}))`,
  },
  {
    id: 'mean',
    enable: logicalTypes('numeric'),
    expression: ({ column }) => `AVG(${numericValue(column!)})`,
  },
  {
    id: 'sum',
    enable: logicalTypes('numeric'),
    expression: ({ column }) => `SUM(${numericValue(column!)})`,
  },
  {
    id: 'stddev',
    enable: logicalTypes('numeric'),
    expression: ({ column }) => `STDDEV_SAMP(${numericValue(column!)})`,
  },
];

/** Parse the JSON string produced by the `top_values` expression. */
function parseTopValues(raw: unknown): Array<{ value: unknown; count: number }> {
  if (typeof raw !== 'string') throw new Error('Invalid BigQuery top_values result');
  let entries: unknown;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw new Error('Invalid BigQuery top_values result');
  }
  if (!Array.isArray(entries)) throw new Error('Invalid BigQuery top_values result');
  return entries.map((entry) => {
    if (typeof entry !== 'object' || entry === null) throw new Error('Invalid BigQuery top_values entry');
    const { value, count } = entry as { value?: unknown; count?: unknown };
    const n = Number(count);
    if (!Number.isFinite(n)) throw new Error('Invalid BigQuery top_values entry');
    return { value, count: n };
  });
}

export async function profileTables(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));
  const models: Profile['models'] = [];

  for (const source of schema.models) {
    const profile: Profile['models'][number] = { name: source.name, metrics: {}, columns: [] };
    models.push(profile);

    const pending: { expression: string; id: string; output: Record<string, unknown> }[] = [];
    const table = sqlIdentifier(source.name);
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