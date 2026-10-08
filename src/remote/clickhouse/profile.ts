import { column, logicalTypes, table, TOP_VALUES_OPTIONS, validateMetricConfig } from '../../util/profile';
import { sqlIdentifier } from '../../util/sql';

import type { FieldProfile, LogicalType, Metric, ParsedProfileOptions, Profile, Schema, TableProfile } from '../../types';

interface Context {
  table: string;
  column?: string;
  field?: FieldProfile;
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
    expression: ({ column }) => `countIf(isNotNull(${column})) - uniqExactIf(toString(${column}), isNotNull(${column}))`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
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
    enable: logicalTypes('numeric'),
    expression: ({ column }) => `min(${numeric(column!)})`,
  },
  {
    id: 'min',
    enable: logicalTypes('date'),
    expression: ({ column, field }) => `min(${timestampExpression(column!, field!.type)})`,
  },
  {
    id: 'max',
    enable: logicalTypes('numeric'),
    expression: ({ column }) => `max(${numeric(column!)})`,
  },
  {
    id: 'max',
    enable: logicalTypes('date'),
    expression: ({ column, field }) => `max(${timestampExpression(column!, field!.type)})`,
  },
  { id: 'min_length', enable: logicalTypes('string'), expression: ({ column }) => `min(lengthUTF8(toString(${column})))` },
  { id: 'max_length', enable: logicalTypes('string'), expression: ({ column }) => `max(lengthUTF8(toString(${column})))` },
  { id: 'mean', enable: logicalTypes('numeric'), expression: ({ column }) => `avg(${numeric(column!)})` },
  { id: 'sum', enable: logicalTypes('numeric'), expression: ({ column }) => `sum(${numeric(column!)})` },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: ({ column }) => `stddevSamp(${numeric(column!)})` },
  { id: 'median', enable: logicalTypes('numeric'), expression: ({ column }) => `median(${numeric(column!)})` },
];

function parseTopValues(raw: unknown): Array<{ value: unknown; count: number }> | null {
  if (raw == null) return null;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(parsed)) return null;
  return parsed
    .map((entry) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        return { value: entry[0], count: Number(entry[1]) };
      }
      if (entry && typeof entry === 'object' && 'value' in entry && 'count' in entry) {
        const record = entry as { value: unknown; count: unknown };
        return { value: record.value, count: Number(record.count) };
      }
      return null;
    })
    .filter((entry): entry is { value: unknown; count: number } => !!entry && Number.isFinite(entry.count));
}

export async function profileTables(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => {
    validateMetricConfig(metric, BUILTIN_METRICS);
    return { metric, definitions: BUILTIN_METRICS.filter(({ id }) => id === metric.id) };
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
    const table = sqlIdentifier(source.name);
    const add = (output: Record<string, unknown>, field?: FieldProfile) => {
      for (const { metric, definitions } of metrics) {
        const definition = definitions.find(({ enable }) => enable({ target: field ? 'column' : 'table', field }));
        if (!definition) continue;
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
      `SELECT ${pending.map(({ expression }, i) => `${expression} AS ${sqlIdentifier(`m${i}`)}`).join(', ')} FROM ${table}`
    );
    if (!row) throw new Error(`Missing profile result for table: ${source.name}`);
    pending.forEach(({ id, output }, i) => {
      const raw = row[`m${i}`];
      delete output[id];
      if (id === 'top_values') {
        const value = parseTopValues(raw);
        if (value != null) output[id] = value;
      } else {
        const value = raw == null ? null : Number(raw);
        output[id] = value === null || Number.isFinite(value) ? value : null;
      }
    });
  }
  return { ...schema, tables, generatedAt: Date.now() };
}
