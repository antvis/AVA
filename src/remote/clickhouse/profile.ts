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

type ClickHouseMetric = Metric<(context: Context) => string>;

function unwrapType(type: string): string {
  let current = type.trim();
  while (true) {
    const next = current.match(/^(?:LowCardinality|Nullable)\((.*)\)$/i)?.[1]?.trim();
    if (!next) return current;
    current = next;
  }
}

export function logicalType(type: string): LogicalType {
  const base = unwrapType(type);
  if (/^(?:U?Int(?:8|16|32|64|128|256)|Float(?:32|64)|BFloat16|Decimal(?:32|64|128|256)?\(.+\))$/i.test(base)) {
    return 'numeric';
  }
  if (/^(?:String|FixedString\(\d+\)|UUID|Enum(?:8|16)\(.+\)|IPv4|IPv6)$/i.test(base)) return 'string';
  if (/^Bool$/i.test(base)) return 'boolean';
  if (/^(?:Date|Date32|DateTime(?:64)?(?:\(.+\))?)$/i.test(base)) return 'date';
  return 'unknown';
}

function numeric(expression: string): string {
  return `toFloat64(${expression})`;
}

function timestampExpression(column: string, type: string): string {
  return /^DateTime/i.test(unwrapType(type))
    ? `toUnixTimestamp(toTimeZone(${column}, 'UTC')) * 1000`
    : `toUnixTimestamp(toDateTime(${column}, 'UTC')) * 1000`;
}

export const BUILTIN_METRICS: ClickHouseMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'count()' },
  { id: 'null_count', enable: column, expression: ({ column }) => `countIf(isNull(${column}))` },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `uniqExactIf(${column}, isNotNull(${column}))`,
  },
  {
    id: 'duplicate_count',
    enable: column,
    expression: ({ column }) =>
      `countIf(isNotNull(${column})) - uniqExactIf(toString(${column}), isNotNull(${column}))`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      // ClickHouse cannot wrap Array in Nullable; JSON distinguishes omitted metrics from empty lists.
      return `if(uniqExactIf(${column}, isNotNull(${column})) > count() * ${maxDistinctRatio}, NULL,
        (SELECT toJSONString(groupArray((v, n))) FROM (
          SELECT ${column} AS v, count() AS n
          FROM ${table}
          WHERE isNotNull(${column})
          GROUP BY v
          ORDER BY n DESC, v ASC
          LIMIT ${limit}
        )))`;
    },
  },
  {
    id: 'min',
    enable: logicalTypes('numeric', 'date'),
    expression: ({ column, field }) =>
      `min(${field!.logicalType === 'date' ? timestampExpression(column!, field!.type) : numeric(column!)})`,
  },
  {
    id: 'max',
    enable: logicalTypes('numeric', 'date'),
    expression: ({ column, field }) =>
      `max(${field!.logicalType === 'date' ? timestampExpression(column!, field!.type) : numeric(column!)})`,
  },
  {
    id: 'min_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `min(lengthUTF8(toString(${column})))`,
  },
  {
    id: 'max_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `max(lengthUTF8(toString(${column})))`,
  },
  { id: 'mean', enable: logicalTypes('numeric'), expression: ({ column }) => `avg(${numeric(column!)})` },
  { id: 'sum', enable: logicalTypes('numeric'), expression: ({ column }) => `sum(${numeric(column!)})` },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: ({ column }) => `stddevSamp(${numeric(column!)})` },
  { id: 'median', enable: logicalTypes('numeric'), expression: ({ column }) => `median(${numeric(column!)})` },
];

function parseTopValues(raw: unknown): Array<{ value: unknown; count: number }> {
  if (typeof raw !== 'string') throw new Error('Invalid ClickHouse top_values result');
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries)) throw new Error('Invalid ClickHouse top_values result');
  return entries.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error('Invalid ClickHouse top_values entry');
    }
    const count = Number(entry[1]);
    if (!Number.isFinite(count)) throw new Error('Invalid ClickHouse top_values count');
    return { value: entry[0], count };
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
    const profile: Profile['models'][number] = {
      name: source.name,
      metrics: {},
      columns: [],
    };
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
