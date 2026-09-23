import { column, logicalTypes, table, TOP_VALUES_OPTIONS, validateMetricConfig } from '../../util/profile';
import { sqlIdentifier } from '../../util/sql';

import { SUPABASE_SCHEMA } from './schema';

import type {
  FieldProfile,
  LogicalType,
  Metric,
  ParsedProfileOptions,
  Profile,
  Schema,
  TableProfile,
} from '../../types';

interface Context {
  table: string;
  column?: string;
  field?: FieldProfile;
  metric: ParsedProfileOptions['metrics'][number];
}

type PostgreSQLMetric = Metric<(context: Context) => string>;

export function logicalType(type: string): LogicalType {
  if (/^(smallint|integer|bigint|real|double precision|numeric(?:\(.*\))?|decimal(?:\(.*\))?)$/i.test(type))
    return 'numeric';
  if (/^(text|character(?: varying)?(?:\(\d+\))?|varchar(?:\(\d+\))?|char(?:\(\d+\))?|uuid|name)$/i.test(type))
    return 'string';
  if (/^boolean$/i.test(type)) return 'boolean';
  if (/^(date|timestamp(?:\(\d+\))?(?: with(?:out)? time zone)?)$/i.test(type)) return 'date';
  return 'unknown';
}

function aggregate(fn: string, { column, field }: Context): string {
  const filter =
    field!.logicalType === 'date' ? `isfinite(${column})` : `${column}::text NOT IN ('NaN', 'Infinity', '-Infinity')`;
  const expression =
    fn === 'median' ? `percentile_cont(0.5) WITHIN GROUP (ORDER BY ${column}::double precision)` : `${fn}(${column})`;
  const result = `${expression} FILTER (WHERE ${filter})`;
  return field!.logicalType === 'date' ? `EXTRACT(EPOCH FROM (${result})) * 1000` : result;
}

export const BUILTIN_METRICS: PostgreSQLMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT(*) - COUNT(${column})` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column})`,
  },
  // Unknown native types (e.g. json) need not have a PostgreSQL equality operator.
  {
    id: 'duplicate_count',
    enable: column,
    expression: ({ column, field }) =>
      `COUNT(${column}) - COUNT(DISTINCT ${column}${field!.logicalType === 'unknown' ? '::text' : ''})`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      return `CASE WHEN COUNT(DISTINCT ${column}) > COUNT(*) * ${maxDistinctRatio}
        THEN NULL ELSE (SELECT COALESCE(jsonb_agg(jsonb_build_object('value', v, 'count', n) ORDER BY n DESC, v ASC), '[]'::jsonb)
          FROM (SELECT ${column} AS v, COUNT(*) AS n FROM ${table}
            WHERE ${column} IS NOT NULL GROUP BY ${column}
            ORDER BY n DESC, v ASC LIMIT ${limit}) AS ranked) END`;
    },
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: (context) => aggregate('min', context) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: (context) => aggregate('max', context) },
  { id: 'min_length', enable: logicalTypes('string'), expression: ({ column }) => `MIN(length(${column}::text))` },
  { id: 'max_length', enable: logicalTypes('string'), expression: ({ column }) => `MAX(length(${column}::text))` },
  { id: 'mean', enable: logicalTypes('numeric'), expression: (context) => aggregate('avg', context) },
  { id: 'sum', enable: logicalTypes('numeric'), expression: (context) => aggregate('sum', context) },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: (context) => aggregate('stddev_samp', context) },
  { id: 'median', enable: logicalTypes('numeric'), expression: (context) => aggregate('median', context) },
];

export async function profileTables(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => {
    validateMetricConfig(metric, BUILTIN_METRICS);
    return { metric, definition: BUILTIN_METRICS.find(({ id }) => id === metric.id)! };
  });
  const tables: TableProfile[] = [];
  for (const source of schema.tables) {
    const profile: TableProfile = {
      ...source,
      metrics: {},
      fields: source.fields.map((field) => ({ ...field, logicalType: logicalType(field.type), metrics: {} })),
    };
    tables.push(profile);
    const pending: { expression: string; id: string; output: Record<string, unknown> }[] = [];
    const table = `${sqlIdentifier(SUPABASE_SCHEMA)}.${sqlIdentifier(source.name)}`;
    const add = (output: Record<string, unknown>, field?: FieldProfile) => {
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
    profile.fields.forEach((field) => add(field.metrics, field));
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
        if (raw != null) output[id] = raw;
      } else {
        const value = raw == null ? null : Number(raw);
        output[id] = value === null || Number.isFinite(value) ? value : null;
      }
    });
  }
  return { ...schema, tables, generatedAt: Date.now() };
}
