import { sqlIdentifier } from '../util/sql';
import { getMetric } from '../profile/registry';

import type { DuckDBConnection, Schema } from '../types';
import type {
  ParsedProfileOptions,
  FieldProfile,
  LogicalType,
  MetricId,
  Profile,
  TableProfile,
} from '../profile/types';

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

// Metrics supported by DuckDB.
// TODO(profile): Add histograms and quartiles with clear result formats and boundary tests.
const EXPRESSIONS: Readonly<Record<string, (context: ExpressionContext) => string>> = {
  row_count: () => 'COUNT(*)',
  null_count: ({ column }) => `COUNT(*) - COUNT(${column})`,
  distinct_count: ({ column }) => `COUNT(DISTINCT ${column})`,
  duplicate_count: ({ column }) => `COUNT(${column}) - COUNT(DISTINCT ${column})`,
  top_values: ({ table, column, metric }) => {
    const { limit, maxDistinctRatio } = metric;
    // Return the most common values.
    return `CASE WHEN COUNT(DISTINCT ${column}) > COUNT(*) * ${maxDistinctRatio}
      THEN NULL ELSE COALESCE(first((SELECT list(struct_pack(value := v, count := CAST(n AS DOUBLE)) ORDER BY n DESC, v ASC)
        FROM (SELECT ${column} AS v, COUNT(*) AS n FROM ${table}
          WHERE ${column} IS NOT NULL GROUP BY ${column}
          ORDER BY n DESC, v ASC LIMIT ${limit}) AS ranked)), []) END`;
  },
  min: (context) => range('min', context),
  max: (context) => range('max', context),
  mean: (context) => aggregate('avg', context),
  sum: (context) => aggregate('sum', context),
  stddev: (context) => aggregate('stddev_samp', context),
  median: (context) => aggregate('median', context),
  min_length: ({ column }) => `MIN(length(CAST(${column} AS VARCHAR)))`,
  max_length: ({ column }) => `MAX(length(CAST(${column} AS VARCHAR)))`,
};

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
    const profile: TableProfile = {
      ...table,
      metrics: {},
      fields: table.fields.map((field) => ({
        ...field,
        logicalType: logicalType(field.type),
        metrics: {},
      })),
    };
    profiles.push(profile);

    const pending: Array<{ expression: string; metricId: MetricId; output: Record<string, unknown> }> = [];
    const addMetrics = (output: Record<string, unknown>, field?: FieldProfile) => {
      for (const metric of metrics) {
        const { id } = metric;
        const buildExpression = EXPRESSIONS[id];
        if (!getMetric(id).enable({ target: field ? 'column' : 'table', field }) || !buildExpression) {
          continue;
        }
        pending.push({
          expression: buildExpression({
            table: sqlIdentifier(name),
            column: field ? sqlIdentifier(field.name) : undefined,
            field,
            metric,
          }),
          metricId: id,
          output,
        });
      }
    };
    // Add metrics for the table.
    addMetrics(profile.metrics);
    // Add metrics for each field (column) in the table.
    profile.fields.forEach((field) => addMetrics(field.metrics, field));

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
