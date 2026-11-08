import { column, logicalTypes, table, TOP_VALUES_OPTIONS, resolveMetric } from '../../util/profile';

import type { MetricField, Metric } from '../../util/profile';
import type { LogicalType, ParsedProfileOptions, Profile, Schema } from '../../contracts';

interface Context {
  table: string;
  column?: string;
  field?: MetricField;
  metric: ParsedProfileOptions['metrics'][number];
}

type SQLServerMetric = Metric<(context: Context) => string>;

export function logicalType(type: string): LogicalType {
  const native = type.trim();
  if (
    /^(?:tinyint|smallint|int|bigint|real|float(?:\(\d+\))?|decimal(?:\(.*\))?|numeric(?:\(.*\))?|money|smallmoney)$/i.test(
      native
    )
  )
    return 'numeric';
  if (/^(?:n?(?:var)?char(?:\((?:\d+|max)\))?|n?text|uniqueidentifier)$/i.test(native)) return 'string';
  if (/^bit$/i.test(native)) return 'boolean';
  if (/^(?:date|smalldatetime|datetime|datetime2(?:\(\d+\))?|datetimeoffset(?:\(\d+\))?)$/i.test(native)) return 'date';
  return 'unknown';
}

function identifier(name: string): string {
  return `[${name.replace(/]/g, ']]')}]`;
}

/** Legacy LOB and spatial types need a comparable representation for DISTINCT. */
function comparable({ column, field }: Context): string {
  if (/^(?:text|ntext)$/i.test(field!.type)) return `CONVERT(nvarchar(max), ${column})`;
  if (/^(?:xml|image|geometry|geography)$/i.test(field!.type)) return `CONVERT(varbinary(max), ${column})`;
  return column!;
}

function aggregate(fn: string, { column }: Context): string {
  return `${fn}(CONVERT(float, ${column}))`;
}

function range(fn: string, context: Context): string {
  return context.field!.logicalType === 'date'
    ? `DATEDIFF_BIG(millisecond, CONVERT(datetimeoffset, N'1970-01-01T00:00:00+00:00'), ${fn}(${context.column}))`
    : aggregate(fn, context);
}

function length(column: string): string {
  // SC counts surrogate pairs once; the suffix keeps LEN from discarding trailing spaces.
  return `LEN(CONVERT(nvarchar(max), ${column}) COLLATE Latin1_General_100_CI_AS_SC + N'.') - 1`;
}

export const BUILTIN_METRICS: SQLServerMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT_BIG(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT_BIG(CASE WHEN ${column} IS NULL THEN 1 END)` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COUNT_BIG(DISTINCT ${comparable(context)})`,
  },
  {
    id: 'duplicate_count',
    enable: column,
    expression: (context) =>
      `COUNT_BIG(CASE WHEN ${context.column} IS NOT NULL THEN 1 END) - COUNT_BIG(DISTINCT ${comparable(context)})`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: (context) => {
      const { table, column, metric } = context;
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      const value = comparable(context);
      return `CASE WHEN COUNT_BIG(DISTINCT ${value}) > COUNT_BIG(*) * ${maxDistinctRatio}
        THEN NULL ELSE COALESCE((SELECT TOP (${limit}) ${value} AS [value], COUNT_BIG(*) AS [count]
          FROM ${table} WHERE ${column} IS NOT NULL
          GROUP BY ${value} ORDER BY [count] DESC, [value] ASC
          FOR JSON PATH), N'[]') END`;
    },
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: (context) => range('MIN', context) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: (context) => range('MAX', context) },
  { id: 'min_length', enable: logicalTypes('string'), expression: ({ column }) => `MIN(${length(column!)})` },
  { id: 'max_length', enable: logicalTypes('string'), expression: ({ column }) => `MAX(${length(column!)})` },
  { id: 'mean', enable: logicalTypes('numeric'), expression: (context) => aggregate('AVG', context) },
  { id: 'sum', enable: logicalTypes('numeric'), expression: (context) => aggregate('SUM', context) },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: (context) => aggregate('STDEV', context) },
  {
    id: 'median',
    enable: logicalTypes('numeric'),
    expression: ({ table, column }) =>
      `(SELECT TOP (1) PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CONVERT(float, ${column})) OVER () FROM ${table})`,
  },
];

/** Compute requested metrics remotely, batching aggregate expressions per table. */
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
    const reference = source.tableReference;
    const parts = reference.catalog === undefined ? [] : [identifier(reference.catalog)];
    if (reference.schema !== undefined) parts.push(identifier(reference.schema));
    else if (reference.catalog !== undefined) parts.push('');
    parts.push(identifier(reference.table));
    const table = parts.join('.');
    const add = (output: Record<string, unknown>, field?: MetricField) => {
      for (const { metric, definition } of metrics) {
        if (!definition.enable({ target: field ? 'column' : 'table', field })) continue;
        pending.push({
          id: metric.id,
          output,
          expression: definition.expression({
            table,
            column: field ? identifier(field.name) : undefined,
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
    // Reserve one of SQL Server's 4096 SELECT columns for the aggregate below,
    // which guarantees a result row for empty tables and median-only selections.
    const batchSize = 4095;
    for (let start = 0; start < pending.length; start += batchSize) {
      const batch = pending.slice(start, start + batchSize);
      const [row] = await runQuery(
        `SELECT COUNT_BIG(*) AS [__ava_count], ${batch
          .map(({ expression }, i) => `${expression} AS ${identifier(`m${i}`)}`)
          .join(', ')} FROM ${table}`
      );
      if (!row) throw new Error(`Missing profile result for table: ${source.name}`);
      batch.forEach(({ id, output }, i) => {
        const raw = row[`m${i}`];
        delete output[id];
        if (id === 'top_values') {
          if (raw != null) output[id] = JSON.parse(raw as string);
        } else {
          const value = raw == null ? null : Number(raw);
          output[id] = value === null || Number.isFinite(value) ? value : null;
        }
      });
    }
  }
  return { models };
}
