import { sqlIdentifier } from '../util/sql';

import type {
  DuckDBConnection,
  Schema,
  ParsedProfileOptions,
  FieldProfile,
  LogicalType,
  Metric,
  MetricId,
  Profile,
  TableProfile,
  TableSchema,
} from '../types';
import { validateMetricConfig } from '../util/profile';

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
  // Other types are unknown.
  return 'unknown';
}

interface ExpressionContext {
  readonly table: string;
  readonly column?: string;
  readonly field?: FieldProfile;
  readonly metric: ParsedProfileOptions['metrics'][number];
}

export type DuckDBMetricExpression = (context: ExpressionContext) => string;
export type DuckDBMetric = Metric<DuckDBMetricExpression>;

const table: Metric['enable'] = ({ target }) => target === 'table';
const column: Metric['enable'] = ({ target }) => target === 'column';
const logicalTypes =
  (...types: LogicalType[]): Metric['enable'] =>
  ({ target, field }) =>
    target === 'column' && !!field && types.includes(field.logicalType);

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

// TODO(profile): Add histograms and quartiles with clear result formats and boundary tests.
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
    options: {
      limit: {
        validate: (value) => {
          if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error('top_values.limit must be a non-negative safe integer');
          }
        },
      },
      maxDistinctRatio: {
        validate: (value) => {
          if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error('top_values.maxDistinctRatio must be between 0 and 1');
          }
        },
      },
    },
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

export const DEFAULT_METRICS = ['row_count', 'null_count', 'distinct_count', 'top_values', 'min', 'max', 'mean'];

function getMetric(id: MetricId): DuckDBMetric {
  const metric = BUILTIN_METRICS.find((definition) => definition.id === id);
  if (!metric) throw new Error(`Unknown metric: ${id}`);
  return metric;
}

/**
 * Add query values to the metric results.
 */
function postProcessMetrics(
  row: Record<string, unknown>,
  pending: { metricId: MetricId; output: Record<string, unknown> }[]
): void {
  for (let i = 0; i < pending.length; i += 1) {
    const { metricId, output } = pending[i];
    const raw = row[`m${i}`];
    if (metricId === 'top_values' && raw == null) continue;
    if (Array.isArray(raw)) {
      output[metricId] = raw;
    } else {
      // Keep numeric metrics usable in JavaScript.
      // TODO(profile): Add a lossless format if exact large numbers are needed.
      const number = raw == null ? null : Number(raw);
      output[metricId] = number === null || Number.isFinite(number) ? number : null;
    }
  }
}

function initTableProfile(table: TableSchema): TableProfile {
  return {
    ...table,
    metrics: {},
    fields: table.fields.map((field) => ({
      ...field,
      logicalType: logicalType(field.type),
      metrics: {},
    })),
  };
}

/**
 * Build profiles for all tables.
 */
export async function profileTables(
  connection: DuckDBConnection,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const { metrics } = options;
  const profiles: TableProfile[] = [];

  for (const table of schema.tables) {
    const { name } = table;
    const profile = initTableProfile(table);
    profiles.push(profile);

    const pending: Array<{ expression: string; metricId: MetricId; output: Record<string, unknown> }> = [];

    const addMetrics = (output: Record<string, unknown>, field?: FieldProfile) => {
      for (const metric of metrics) {
        if (!validateMetricConfig(metric, BUILTIN_METRICS)) {
          continue;
        }

        const definition = getMetric(metric.id);

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

    const addTableMetrics = (table: TableProfile) => {
      addMetrics(table.metrics);
    };
    const addFieldMetrics = (field: FieldProfile) => {
      addMetrics(field.metrics, field);
    };

    // Add metrics for the table.
    addTableMetrics(profile);
    // Add metrics for each field (column) in the table.
    profile.fields.forEach(addFieldMetrics);

    if (!pending.length) continue;

    // Collect the requested statistics.
    const sql = `SELECT ${pending
      .map(({ expression }, i) => `${expression} AS ${sqlIdentifier(`m${i}`)}`)
      .join(', ')} FROM ${sqlIdentifier(name)}`;
    const row = (await connection.runAndReadAll(sql)).getRowObjectsJson()[0];
    postProcessMetrics(row, pending);
  }

  return { ...schema, tables: profiles, generatedAt: Date.now() };
}
