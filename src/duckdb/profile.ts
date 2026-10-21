import { sqlIdentifier } from '../util/sql';
import { resolveMetric, table, column, logicalTypes, TOP_VALUES_OPTIONS } from '../util/profile';

import type { MetricField } from '../util/profile';
import type { DuckDBConnection, Schema, ParsedProfileOptions, LogicalType, Metric, MetricId, Profile } from '../types';

/** Map a database type to a profile type. */
export function logicalType(nativeType: string): LogicalType {
  if (/\[[^\]]*\]$/.test(nativeType)) return 'unknown';
  if (
    /^(U?(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT)|INT[1248]?|FLOAT|DOUBLE|REAL|DECIMAL(?:\(.*\))?|NUMERIC(?:\(.*\))?|BIGNUM)$/i.test(
      nativeType
    )
  )
    return 'numeric';
  if (/^(VARCHAR|CHAR|BPCHAR|TEXT|STRING|UUID|ENUM\(.*\))$/i.test(nativeType)) return 'string';
  if (/^BOOLEAN$/i.test(nativeType)) return 'boolean';
  if (/^(DATE|TIMESTAMP(?:_S|_MS|_NS|TZ| WITH TIME ZONE)?)$/i.test(nativeType)) return 'date';
  return 'unknown';
}

interface ExpressionContext {
  readonly table: string;
  readonly column?: string;
  readonly field?: MetricField;
  readonly metric: ParsedProfileOptions['metrics'][number];
}

export type DuckDBMetricExpression = (context: ExpressionContext) => string;
export type DuckDBMetric = Metric<DuckDBMetricExpression>;

/** Build an aggregate for valid values. */
function aggregate(fn: string, { column, field }: ExpressionContext): string {
  if (!field) throw new Error(`${fn} requires a column`);
  const finite = field.logicalType === 'date' || /^(FLOAT|DOUBLE|REAL)$/i.test(field.type);
  return `${fn}(${column})${finite ? ` FILTER (WHERE isfinite(${column}))` : ''}`;
}

function range(fn: string, context: ExpressionContext): string {
  const expression = aggregate(fn, context);
  return context.field?.logicalType === 'date' ? `epoch_ms(${expression})` : expression;
}

export const BUILTIN_METRICS: DuckDBMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT(*) - COUNT(${column})` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column})`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      return `CASE WHEN COUNT(DISTINCT ${column}) > COUNT(*) * ${maxDistinctRatio}
      THEN NULL ELSE COALESCE(first((SELECT list(struct_pack(value := v, count := CAST(n AS DOUBLE)) ORDER BY n DESC, v ASC)
        FROM (SELECT ${column} AS v, COUNT(*) AS n FROM ${table}
          WHERE ${column} IS NOT NULL GROUP BY ${column}
          ORDER BY n DESC, v ASC LIMIT ${limit}) AS ranked)), []) END`;
    },
  },
  {
    id: 'duplicate_count',
    enable: column,
    expression: ({ column }) => `COUNT(${column}) - COUNT(DISTINCT ${column})`,
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: (context) => range('min', context) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: (context) => range('max', context) },
  {
    id: 'min_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MIN(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'max_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MAX(length(CAST(${column} AS VARCHAR)))`,
  },
  { id: 'mean', enable: logicalTypes('numeric'), expression: (context) => aggregate('avg', context) },
  { id: 'sum', enable: logicalTypes('numeric'), expression: (context) => aggregate('sum', context) },
  {
    id: 'stddev',
    enable: logicalTypes('numeric'),
    expression: (context) => aggregate('stddev_samp', context),
  },
  { id: 'median', enable: logicalTypes('numeric'), expression: (context) => aggregate('median', context) },
];

export { DEFAULT_METRICS } from '../util/profile';

/** Decode aggregate values into profile metrics. */
function postProcessMetrics(
  row: Record<string, unknown>,
  pending: { metricId: MetricId; output: Record<string, unknown> }[]
): void {
  for (let i = 0; i < pending.length; i += 1) {
    const { metricId, output } = pending[i];
    const raw = row[`m${i}`];
    delete output[metricId];
    if (metricId === 'top_values' && raw == null) continue;
    if (Array.isArray(raw)) {
      output[metricId] = raw;
    } else {
      // Profile numbers use JavaScript precision, including BIGINT and DECIMAL results.
      const number = raw == null ? null : Number(raw);
      output[metricId] = number === null || Number.isFinite(number) ? number : null;
    }
  }
}

/** Compute requested metrics for each model and column. */
export async function profileTables(
  connection: DuckDBConnection,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));
  const profiles: Profile['models'] = [];

  for (const table of schema.models) {
    const { name } = table;
    const profile: Profile['models'][number] = {
      name,
      metrics: {},
      columns: [],
    };
    profiles.push(profile);

    const pending: Array<{ expression: string; metricId: MetricId; output: Record<string, unknown> }> = [];

    const addMetrics = (output: Record<string, unknown>, field?: MetricField) => {
      for (const { metric, definition } of metrics) {
        const target = field ? 'column' : 'table';
        if (!definition.enable({ target, field })) {
          continue;
        }

        pending.push({
          expression: definition.expression({
            table: sqlIdentifier(name),
            column: field ? sqlIdentifier(field.name) : undefined,
            field,
            metric,
          }),
          metricId: metric.id,
          output,
        });
      }
    };

    addMetrics(profile.metrics);
    profile.columns = table.columns.map((column) => {
      const field = { ...column, logicalType: logicalType(column.type) };
      const metrics = {};
      addMetrics(metrics, field);
      return { name: field.name, properties: { logicalType: field.logicalType }, metrics };
    });

    if (!pending.length) continue;

    const sql = `SELECT ${pending
      .map(({ expression }, i) => `${expression} AS ${sqlIdentifier(`m${i}`)}`)
      .join(', ')} FROM ${sqlIdentifier(name)}`;
    const row = (await connection.runAndReadAll(sql)).getRowObjectsJson()[0];
    postProcessMetrics(row, pending);
  }

  return { models: profiles };
}
