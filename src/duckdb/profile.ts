import { z } from 'zod';

import { sqlIdentifier, sqlQualifiedName } from '../util/sql';
import { resolveMetric, table, column, logicalTypes, TOP_VALUES_OPTIONS } from '../util/profile';

import type { MetricField } from '../util/profile';
import type { Metric, DuckDBConnection, Schema, ParsedProfileOptions, LogicalType, MetricId, Profile } from '../types';

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
  readonly center?: string;
  readonly metric: ParsedProfileOptions['metrics'][number];
}

export type DuckDBMetricExpression = (context: ExpressionContext) => string;
export type DuckDBMetric = Metric<DuckDBMetricExpression>;

type ColumnContext = Pick<ExpressionContext, 'column' | 'field'>;

const floatingPoint = /^(FLOAT|DOUBLE|REAL)$/i;

function finiteFilter({ column, field }: ColumnContext): string {
  return field && (field.logicalType === 'date' || floatingPoint.test(field.type))
    ? ` FILTER (WHERE isfinite(${column}))`
    : '';
}

/** Build an aggregate for valid values. */
function aggregate(fn: string, context: ColumnContext, argument?: string): string {
  if (!context.field) throw new Error(`${fn} requires a column`);
  return `${fn}(${context.column}${argument === undefined ? '' : `, ${argument}`})${finiteFilter(context)}`;
}

function range(fn: string, context: ExpressionContext): string {
  const expression = aggregate(fn, context);
  return context.field?.logicalType === 'date' ? `epoch_ms(${expression})` : expression;
}

function numericCondition(id: string, { column, field }: ExpressionContext): string {
  if (id === 'zero') return `${column} = 0`;
  if (id === 'negative') return `${column} < 0`;
  if (!floatingPoint.test(field!.type)) return id === 'finite' ? `${column} IS NOT NULL` : 'FALSE';
  return `${id === 'infinite' ? 'isinf' : id === 'nan' ? 'isnan' : 'isfinite'}(${column})`;
}

function frequencyHistogram({ column, field }: ColumnContext): string {
  // NaN is unordered in DuckDB's histogram map and must be counted separately.
  return `histogram(${column})${field && floatingPoint.test(field.type) ? ` FILTER (WHERE NOT isnan(${column}))` : ''}`;
}

function singletons(context: ColumnContext): string {
  const count = `COALESCE(list_count(list_filter(map_values(${frequencyHistogram(context)}), n -> n = 1)), 0)`;
  return context.field && floatingPoint.test(context.field.type)
    ? `(${count} + (COUNT(*) FILTER (WHERE isnan(${context.column})) = 1)::BIGINT)`
    : count;
}

function frequencyRanks(context: ColumnContext): string {
  let entries = `map_entries(${frequencyHistogram(context)})`;
  if (context.field && floatingPoint.test(context.field.type)) {
    const nanCount = `COUNT(*) FILTER (WHERE isnan(${context.column}))`;
    entries = `list_concat(${entries}, CASE WHEN ${nanCount} > 0
      THEN [struct_pack(key := 'NaN'::DOUBLE, value := (${nanCount})::UBIGINT)] ELSE [] END)`;
  }
  return `list_transform(${entries}, lambda entry: struct_pack(
    rank := -struct_extract(entry, 'value')::HUGEINT, value := struct_extract(entry, 'key')))`;
}

function frequencyValue(value: string, field?: MetricField): string {
  return field?.logicalType === 'date' ? `CAST(${value} AS VARCHAR)` : value;
}

const shapeMetrics = ['skewness', 'kurtosis'] as const;

function shape(metric: (typeof shapeMetrics)[number], context: ExpressionContext): string {
  const count = `(${aggregate('count', context)})::DOUBLE`;
  const delta = `(${context.column}::DOUBLE - ${context.center})`;
  const centralSum = (power: number) => `fsum(pow(${delta}, ${power}))${finiteFilter(context)}`;
  const second = centralSum(2);
  // Match pandas' sample corrections and round-off threshold for near-zero moments.
  const zeroSmall = (value: string) => `(CASE WHEN abs(${value}) < 1e-14 THEN 0 ELSE ${value} END)`;
  if (metric === 'skewness') {
    return `CASE WHEN ${count} < 3 THEN NULL WHEN abs(${second}) < 1e-14 THEN 0
      ELSE ${count} * sqrt(${count} - 1) / (${count} - 2) * ${zeroSmall(centralSum(3))} / pow(${second}, 1.5) END`;
  }
  const correction = `(${count} - 2) * (${count} - 3)`;
  const denominator = `(${correction} * pow(${second}, 2))`;
  const numerator = `${count} * (${count} + 1) * (${count} - 1) * (${centralSum(4)})`;
  return `CASE WHEN ${count} < 4 THEN NULL WHEN abs(${denominator}) < 1e-14 THEN 0
    ELSE ${zeroSmall(numerator)} / ${denominator} - 3 * pow(${count} - 1, 2) / (${correction}) END`;
}

export const BUILTIN_METRICS: DuckDBMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'valid_count', enable: column, expression: ({ column }) => `COUNT(${column})` },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT(*) - COUNT(${column})` },
  {
    id: 'null_ratio',
    enable: column,
    expression: ({ column }) => `COALESCE((COUNT(*) - COUNT(${column}))::DOUBLE / NULLIF(COUNT(*), 0), 0)`,
  },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column})`,
  },
  {
    id: 'distinct_ratio',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COALESCE(COUNT(DISTINCT ${column})::DOUBLE / NULLIF(COUNT(${column}), 0), 0)`,
  },
  {
    id: 'unique_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: singletons,
  },
  {
    id: 'unique_ratio',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COALESCE(${singletons(context)}::DOUBLE / NULLIF(COUNT(${context.column}), 0), 0)`,
  },
  {
    id: 'is_unique',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(${column}) > 0 AND COUNT(DISTINCT ${column}) = COUNT(${column})`,
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
  {
    id: 'value_counts',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COALESCE(list_transform(list_sort(${frequencyRanks(context)}), lambda entry:
      struct_pack(value := ${frequencyValue("struct_extract(entry, 'value')", context.field)},
        count := -struct_extract(entry, 'rank')::DOUBLE)), [])`,
  },
  {
    id: 'mode',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) =>
      frequencyValue(`struct_extract(list_min(${frequencyRanks(context)}), 'value')`, context.field),
  },
  {
    id: 'mode_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COALESCE(-struct_extract(list_min(${frequencyRanks(context)}), 'rank')::DOUBLE, 0)`,
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
  {
    id: 'mean_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `AVG(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'median_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MEDIAN(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'length_histogram',
    enable: logicalTypes('string'),
    expression: ({ column }) => `COALESCE(list_transform(map_entries(histogram(length(CAST(${column} AS VARCHAR)))),
      lambda entry: struct_pack(length := struct_extract(entry, 'key')::DOUBLE,
        count := struct_extract(entry, 'value')::DOUBLE)), [])`,
  },
  { id: 'mean', enable: logicalTypes('numeric'), expression: (context) => aggregate('avg', context) },
  { id: 'sum', enable: logicalTypes('numeric'), expression: (context) => aggregate('sum', context) },
  {
    id: 'stddev',
    enable: logicalTypes('numeric'),
    expression: (context) => aggregate('stddev_samp', context),
  },
  { id: 'median', enable: logicalTypes('numeric'), expression: (context) => aggregate('median', context) },
  { id: 'variance', enable: logicalTypes('numeric'), expression: (context) => aggregate('var_samp', context) },
  ...shapeMetrics.map(
    (id): DuckDBMetric => ({
      id,
      enable: logicalTypes('numeric'),
      expression: (context) => shape(id, context),
    })
  ),
  { id: 'mad', enable: logicalTypes('numeric'), expression: (context) => aggregate('mad', context) },
  {
    id: 'iqr',
    enable: logicalTypes('numeric'),
    expression: (context) => {
      const quartiles = aggregate('quantile_cont', context, '[0.25, 0.75]');
      return `(${quartiles})[2] - (${quartiles})[1]`;
    },
  },
  {
    id: 'cv',
    enable: logicalTypes('numeric'),
    expression: (context) => `${aggregate('stddev_samp', context)} / NULLIF(${aggregate('avg', context)}, 0)`,
  },
  {
    id: 'range',
    enable: logicalTypes('numeric', 'date'),
    expression: (context) => {
      const min = range('min', context);
      const max = range('max', context);
      // TRY accepts scalar expressions, so bind the aggregate bounds before subtracting.
      return `list_transform([struct_pack(lo := ${min}, hi := ${max})], bounds ->
        COALESCE(TRY((bounds.hi - bounds.lo)::DOUBLE), TRY(bounds.hi::DOUBLE - bounds.lo::DOUBLE)))[1]`;
    },
  },
  {
    id: 'quantiles',
    enable: logicalTypes('numeric'),
    options: {
      probabilities: {
        validate: (value) => {
          z.array(z.number().min(0).max(1)).nonempty().parse(value);
        },
      },
    },
    expression: (context) => {
      const probabilities = `[${(
        (context.metric.probabilities as number[] | undefined) ?? [0.05, 0.25, 0.5, 0.75, 0.95]
      ).join(', ')}]`;
      return `list_transform(list_zip(${probabilities}::DOUBLE[],
        CAST(${aggregate('quantile_cont', context, probabilities)} AS DOUBLE[])),
        pair -> struct_pack(probability := pair[1], value := pair[2]))`;
    },
  },
  ...['zero', 'negative', 'infinite', 'nan', 'finite'].flatMap((kind): DuckDBMetric[] => [
    {
      id: `${kind}_count`,
      enable: logicalTypes('numeric'),
      expression: (context) => `COUNT(*) FILTER (WHERE ${numericCondition(kind, context)})`,
    },
    {
      id: `${kind}_ratio`,
      enable: logicalTypes('numeric'),
      expression: (context) =>
        `COALESCE((COUNT(*) FILTER (WHERE ${numericCondition(kind, context)}))::DOUBLE / NULLIF(COUNT(*), 0), 0)`,
    },
  ]),
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
    if (Array.isArray(raw) || typeof raw === 'boolean' || metricId === 'mode') {
      output[metricId] = raw ?? null;
    } else {
      // Profile numbers use JavaScript precision, including BIGINT and DECIMAL results.
      const number = raw == null ? null : Number(raw);
      output[metricId] = number === null || Number.isFinite(number) ? number : null;
    }
  }
}

/**
 * Compute requested metrics for each model and column.
 */
export async function profileTables(
  connection: DuckDBConnection,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));
  const needsCenters = metrics.some(({ metric }) => metric.id === 'skewness' || metric.id === 'kurtosis');
  const profiles: Profile['models'] = [];

  for (const table of schema.models) {
    const { name, tableReference } = table;
    const reference = sqlQualifiedName(tableReference.table, tableReference.schema);
    const fields = table.columns.map((field) => ({ ...field, logicalType: logicalType(field.type) }));
    const numeric = needsCenters ? fields.filter((field) => field.logicalType === 'numeric') : [];
    const centers = new Map(numeric.map((field, i) => [field.name, sqlIdentifier(`center${i}`)]));
    const centerTable = sqlIdentifier(
      tableReference.table.toLowerCase() === '__ava_centers' ? '__ava_centers_2' : '__ava_centers'
    );
    const sourceAlias = numeric.length ? '__ava_source' : undefined;
    const source = sourceAlias ? `${reference} AS ${sqlIdentifier(sourceAlias)}` : reference;
    const profile: Profile['models'][number] = {
      name,
      metrics: {},
      columns: [],
    };
    profiles.push(profile);

    const pending: Array<{ expression: string; metricId: MetricId; output: Record<string, unknown> }> = [];

    const addMetrics = (output: Record<string, unknown>, field?: MetricField) => {
      const center = field && centers.get(field.name);
      for (const { metric, definition } of metrics) {
        const target = field ? 'column' : 'table';
        if (!definition.enable({ target, field })) {
          continue;
        }

        pending.push({
          expression: definition.expression({
            table: source,
            column: field ? sqlQualifiedName(field.name, sourceAlias) : undefined,
            center: center ? `${centerTable}.${center}` : undefined,
            field,
            metric,
          }),
          metricId: metric.id,
          output,
        });
      }
    };

    addMetrics(profile.metrics);
    profile.columns = fields.map((field) => {
      const metrics = {};
      addMetrics(metrics, field);
      return { name: field.name, properties: { logicalType: field.logicalType }, metrics };
    });

    if (!pending.length) continue;

    // All shape metrics share one pass for centers and one pass for centered moments.
    const withCenters = numeric.length
      ? `WITH ${centerTable} AS (SELECT ${numeric
          .map(
            (field) =>
              `${aggregate('favg', { column: sqlIdentifier(field.name), field })} AS ${centers.get(field.name)}`
          )
          .join(', ')} FROM ${reference}) `
      : '';
    const sql = `${withCenters}SELECT ${pending
      .map(({ expression }, i) => `${expression} AS ${sqlIdentifier(`m${i}`)}`)
      .join(', ')} FROM ${source}${numeric.length ? ` CROSS JOIN ${centerTable}` : ''}`;
    const row = (await connection.runAndReadAll(sql)).getRowObjectsJson()[0];
    postProcessMetrics(row, pending);
  }

  return { models: profiles };
}
