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
    /^(tinyint|smallint|int|bigint|decimal(\(.*\))?|numeric(\(.*\))?|money|smallmoney|float(\(.*\))?|real)$/.test(
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

/** Epoch-milliseconds expression for a date column, preserving the time component. */
function epochMs(column: string): string {
  return `(DATEDIFF_BIG(millisecond, '1970-01-01', ${column}))`;
}

function numericValue(column: string): string {
  return `CAST(${column} AS float)`;
}

/**
 * Legacy `text`/`ntext`/`xml` columns cannot be used directly with
 * COUNT(DISTINCT ...) or LEN(); converting to nvarchar(max) keeps a single bad
 * column from breaking the shared metric query for the whole table.
 */
function columnExpression(field: MetricField): string {
  const base = field.type.trim().toLowerCase().replace(/\(.*\)$/, '');
  if (base === 'text' || base === 'ntext' || base === 'xml') {
    return `CAST(${sqlIdentifier(field.name)} AS nvarchar(max))`;
  }
  return sqlIdentifier(field.name);
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
          SELECT '[' + STRING_AGG(CONCAT('{"value":"', STRING_ESCAPE(CAST(v AS nvarchar(max)), 'json'), '","count":', CAST(n AS nvarchar(20)), '}'), ',') + ']'
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
    const reference = source.tableReference;
    const table = [reference.schema ?? 'dbo', reference.table].map(sqlIdentifier).join('.');
    const add = (output: Record<string, unknown>, field?: MetricField) => {
      for (const { metric, definition } of metrics) {
        if (!definition.enable({ target: field ? 'column' : 'table', field })) continue;
        pending.push({
          id: metric.id,
          output,
          expression: definition.expression({
            table,
            column: field ? columnExpression(field) : undefined,
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

function valuesFor(rows: Record<string, unknown>[], name: string): unknown[] {
  return rows.map((row) => {
    const key = Object.prototype.hasOwnProperty.call(row, name)
      ? name
      : Object.keys(row).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    return key === undefined ? undefined : row[key];
  });
}

function numericValues(values: unknown[]): number[] {
  return values
    .filter((value) => value != null)
    .map(Number)
    .filter((value) => Number.isFinite(value));
}

function dateValues(values: unknown[]): number[] {
  return values
    .filter((value) => value != null)
    .map((value) => (value instanceof Date ? value.getTime() : Date.parse(String(value))))
    .filter((value) => Number.isFinite(value));
}

/**
 * Evaluate the same metric contract directly over mock rows. This avoids
 * pretending that the deliberately small mock SELECT parser supports SQL
 * Server's DISTINCT/CAST/CASE/arithmetic profiling expressions.
 */
export function profileTablesInMemory(
  rowsFor: (source: Schema['models'][number]) => Record<string, unknown>[],
  schema: Schema,
  options: ParsedProfileOptions
): Profile {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));

  const models = schema.models.map((source): Profile['models'][number] => {
    const rows = rowsFor(source);
    const profile: Profile['models'][number] = { name: source.name, metrics: {}, columns: [] };

    const add = (output: Record<string, unknown>, field?: MetricField) => {
      for (const { metric, definition } of metrics) {
        if (!definition.enable({ target: field ? 'column' : 'table', field })) continue;
        const values = field ? valuesFor(rows, field.name) : [];
        const present = values.filter((value) => value != null);
        const numbers = numericValues(values);
        let value: unknown;

        switch (metric.id) {
          case 'row_count':
            value = rows.length;
            break;
          case 'null_count':
            value = values.length - present.length;
            break;
          case 'distinct_count':
            value = new Set(present).size;
            break;
          case 'duplicate_count':
            value = present.length - new Set(present).size;
            break;
          case 'top_values': {
            const distinct = new Set(present).size;
            const ratio = Number(metric.maxDistinctRatio ?? 0.5);
            if (rows.length === 0 || distinct > rows.length * ratio) break;
            const counts = new Map<string, number>();
            for (const entry of present) {
              const key = String(entry);
              counts.set(key, (counts.get(key) ?? 0) + 1);
            }
            const limit = Number(metric.limit ?? 3);
            value = [...counts]
              .map(([entry, count]) => ({ value: entry, count }))
              .sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))
              .slice(0, limit);
            break;
          }
          case 'min':
          case 'max': {
            const candidates = field?.logicalType === 'date' ? dateValues(values) : numbers;
            value = candidates.length
              ? metric.id === 'min'
                ? Math.min(...candidates)
                : Math.max(...candidates)
              : null;
            break;
          }
          case 'min_length':
          case 'max_length': {
            const lengths = present.map((entry) => String(entry).length);
            value = lengths.length
              ? metric.id === 'min_length'
                ? Math.min(...lengths)
                : Math.max(...lengths)
              : null;
            break;
          }
          case 'mean':
            value = numbers.length ? numbers.reduce((sum, entry) => sum + entry, 0) / numbers.length : null;
            break;
          case 'sum':
            value = numbers.length ? numbers.reduce((sum, entry) => sum + entry, 0) : null;
            break;
          case 'stddev': {
            if (numbers.length < 2) {
              value = null;
              break;
            }
            const mean = numbers.reduce((sum, entry) => sum + entry, 0) / numbers.length;
            value = Math.sqrt(
              numbers.reduce((sum, entry) => sum + (entry - mean) ** 2, 0) / (numbers.length - 1)
            );
            break;
          }
          default:
            throw new Error(`Unknown in-memory metric: ${metric.id}`);
        }

        if (value !== undefined) output[metric.id] = value;
      }
    };

    add(profile.metrics);
    profile.columns = source.columns.map((column) => {
      const field = { ...column, logicalType: logicalType(column.type) };
      const columnMetrics = {};
      add(columnMetrics, field);
      return {
        name: field.name,
        properties: { logicalType: field.logicalType },
        metrics: columnMetrics,
      };
    });
    return profile;
  });

  return { models };
}
