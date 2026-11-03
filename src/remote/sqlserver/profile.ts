/**
 * SQL Server profiling. Each metric compiles to read-only T-SQL that the
 * engine batches into one aggregate query per table. Numeric results are
 * trimmed with a bounded float, and `top_values` is packed into a JSON string
 * (mirroring the ClickHouse engine) that this module parses back.
 */
import { column, logicalTypes, table, TOP_VALUES_OPTIONS, resolveMetric } from '../../util/profile';
import { sqlIdentifier } from '../../util/sql';

import type { MetricField } from '../../util/profile';
import type { LogicalType, Metric, ParsedProfileOptions, Profile, Schema } from '../../types';

interface Context {
  table: string;
  column?: string;
  field?: MetricField;
  metric: ParsedProfileOptions['metrics'][number];
}

type SqlServerMetric = Metric<(context: Context) => string>;

export function logicalType(type: string): LogicalType {
  const base = type.trim().toLowerCase();
  if (
    /^(tinyint|smallint|int|bigint|bit|decimal(\(.*\))?|numeric(\(.*\))?|money|smallmoney|float(\(.*\))?|real)$/.test(
      base
    )
  )
    return 'numeric';
  if (/^(char(\(.*\))?|varchar(\(.*\))?|nchar(\(.*\))?|nvarchar(\(.*\))?|text|ntext|uniqueidentifier|xml)$/.test(base))
    return 'string';
  if (/^bit$/.test(base)) return 'boolean';
  if (
    /^(date|datetime|datetime2(\(.*\))?|smalldatetime|datetimeoffset(\(.*\))?|time(\(.*\))?)$/.test(base)
  )
    return 'date';
  return 'unknown';
}

/** Epoch-milliseconds expression for a date column (86400000 ms per day from SQL Server's epoch). */
function epochMs(column: string): string {
  return `(DATEDIFF_BIG(day, '1970-01-01', ${column}) * 86400000.0)`;
}

function numericValue(column: string): string {
  return `CAST(${column} AS float)`;
}

export const BUILTIN_METRICS: SqlServerMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT(*) - COUNT(${column!})` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column!})`,
  },
  {
    id: 'duplicate_count',
    enable: column,
    expression: ({ column }) => `COUNT(${column!}) - COUNT(DISTINCT ${column!})`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      const value = `CAST(${column!} AS nvarchar(4000))`;
      return `CASE WHEN COUNT(DISTINCT ${value}) > COUNT(*) * ${maxDistinctRatio}
        THEN NULL ELSE (
          SELECT '[' + STRING_AGG(CONCAT('{"value":"', REPLACE(CAST(v AS nvarchar(max)), '"', '\\"'), '","count":', CAST(n AS nvarchar(20)), '}'), ',') + ']'
          FROM (
            SELECT TOP (${limit}) ${value} AS v, COUNT(*) AS n
            FROM ${table}
            WHERE ${column!} IS NOT NULL
            GROUP BY ${value}
            ORDER BY n DESC, v ASC
          ) AS ranked
        ) END`;
    },
  },
  {
    id: 'min',
    enable: logicalTypes('numeric', 'date'),
    expression: ({ column, field }) =>
      field!.logicalType === 'date' ? `MIN(${epochMs(column!)})` : `MIN(${numericValue(column!)})`,
  },
  {
    id: 'max',
    enable: logicalTypes('numeric', 'date'),
    expression: ({ column, field }) =>
      field!.logicalType === 'date' ? `MAX(${epochMs(column!)})` : `MAX(${numericValue(column!)})`,
  },
  {
    id: 'min_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MIN(LEN(${column!}))`,
  },
  {
    id: 'max_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MAX(LEN(${column!}))`,
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
    expression: ({ column }) => `STDEV(${numericValue(column!)})`,
  },
];

/** Parse the JSON string produced by the `top_values` expression. */
function parseTopValues(raw: unknown): Array<{ value: unknown; count: number }> {
  if (typeof raw !== 'string') throw new Error('Invalid SQL Server top_values result');
  let entries: unknown;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw new Error('Invalid SQL Server top_values result');
  }
  if (!Array.isArray(entries)) throw new Error('Invalid SQL Server top_values result');
  return entries.map((entry) => {
    if (typeof entry !== 'object' || entry === null) throw new Error('Invalid SQL Server top_values entry');
    const { value, count } = entry as { value?: unknown; count?: unknown };
    const n = Number(count);
    if (!Number.isFinite(n)) throw new Error('Invalid SQL Server top_values entry');
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