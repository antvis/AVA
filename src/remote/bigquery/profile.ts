/** Profile metrics in GoogleSQL; each table is profiled by one aggregate query. */
import { column, logicalTypes, table, TOP_VALUES_OPTIONS, resolveMetric } from '../../util/profile';
import { bigQueryIdentifier } from '../../util/sql';

import { logicalType } from './values';

import type { MetricField } from '../../util/profile';
import type { Metric, ParsedProfileOptions, Profile, Schema } from '../../types';

interface Context {
  table: string;
  column?: string;
  field?: MetricField;
  metric: ParsedProfileOptions['metrics'][number];
}

type BigQueryMetric = Metric<(context: Context) => string>;

/** FLOAT64 view of a numeric column with NaN and ±Infinity excluded, as in the other engines. */
function finite(column: string): string {
  const value = `CAST(${column} AS FLOAT64)`;
  return `IF(IS_NAN(${value}) OR IS_INF(${value}), NULL, ${value})`;
}

/** Date bounds are Unix milliseconds; DATE and DATETIME are read as UTC. */
function bound(fn: 'MIN' | 'MAX', { column, field }: Context): string {
  if (field!.logicalType !== 'date') return `${fn}(${finite(column!)})`;
  return field!.type === 'TIMESTAMP' ? `UNIX_MILLIS(${fn}(${column}))` : `UNIX_MILLIS(TIMESTAMP(${fn}(${column})))`;
}

export const BUILTIN_METRICS: BigQueryMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNTIF(${column} IS NULL)` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column})`,
  },
  // ARRAY, STRUCT, JSON and GEOGRAPHY values are not groupable; compare their JSON encodings instead.
  {
    id: 'duplicate_count',
    enable: column,
    expression: ({ column, field }) =>
      `COUNTIF(${column} IS NOT NULL) - COUNT(DISTINCT ${
        field!.logicalType === 'unknown' ? `IF(${column} IS NULL, NULL, TO_JSON_STRING(${column}))` : column
      })`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      return `IF(COUNT(DISTINCT ${column}) > COUNT(*) * ${maxDistinctRatio}, NULL,
        IFNULL((SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(v AS value, n AS count) ORDER BY n DESC, v ASC LIMIT ${limit}))
          FROM (SELECT ${column} AS v, COUNT(*) AS n FROM ${table} WHERE ${column} IS NOT NULL GROUP BY v)), '[]'))`;
    },
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: (context) => bound('MIN', context) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: (context) => bound('MAX', context) },
  { id: 'min_length', enable: logicalTypes('string'), expression: ({ column }) => `MIN(CHAR_LENGTH(${column}))` },
  { id: 'max_length', enable: logicalTypes('string'), expression: ({ column }) => `MAX(CHAR_LENGTH(${column}))` },
  { id: 'mean', enable: logicalTypes('numeric'), expression: ({ column }) => `AVG(${finite(column!)})` },
  { id: 'sum', enable: logicalTypes('numeric'), expression: ({ column }) => `SUM(${finite(column!)})` },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: ({ column }) => `STDDEV_SAMP(${finite(column!)})` },
  // GoogleSQL has no exact median aggregate; PERCENTILE_CONT is an exact analytic function.
  {
    id: 'median',
    enable: logicalTypes('numeric'),
    expression: ({ table, column }) =>
      `(SELECT PERCENTILE_CONT(${finite(column!)}, 0.5) OVER () FROM ${table} LIMIT 1)`,
  },
];

function parseTopValues(raw: unknown): Array<{ value: unknown; count: number }> {
  const entries = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (entries === null) return [];
  if (!Array.isArray(entries)) throw new Error('Invalid BigQuery top_values result');
  return entries.map((entry) => {
    const count = Number(entry?.count);
    if (!entry || typeof entry !== 'object' || !('value' in entry) || !Number.isFinite(count)) {
      throw new Error('Invalid BigQuery top_values entry');
    }
    return { value: entry.value, count };
  });
}

/** Fully qualified table name, or the bare name resolved against the default dataset. */
function tableName({ name, tableReference }: Schema['models'][number]): string {
  const { catalog, schema, table } = tableReference ?? {};
  if (!table) return bigQueryIdentifier(name);
  return [catalog, schema, table]
    .filter((part): part is string => !!part)
    .map(bigQueryIdentifier)
    .join('.');
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
    const table = tableName(source);
    const add = (output: Record<string, unknown>, field?: MetricField) => {
      for (const { metric, definition } of metrics) {
        if (!definition.enable({ target: field ? 'column' : 'table', field })) continue;
        pending.push({
          id: metric.id,
          output,
          expression: definition.expression({
            table,
            column: field ? bigQueryIdentifier(field.name) : undefined,
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
      `SELECT ${pending.map(({ expression }, i) => `${expression} AS m${i}`).join(', ')} FROM ${table}`
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
