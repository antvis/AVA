import { column, logicalTypes, table, TOP_VALUES_OPTIONS, resolveMetric } from '../../util/profile';

import type { MetricField } from '../../util/profile';
import type { JsonValue, LogicalType, Metric, ParsedProfileOptions, Profile, Schema } from '../../types';

interface Context {
  rowCount: number;
  values: unknown[];
  numbers: number[];
  distinct: Map<unknown, number>;
  metric: ParsedProfileOptions['metrics'][number];
}

type InterpreterMetric = Metric<(context: Context) => JsonValue | undefined>;

function range(values: number[], compare: (a: number, b: number) => number): number | null {
  return values.length ? values.reduce((a, b) => compare(a, b)) : null;
}

export const BUILTIN_METRICS: InterpreterMetric[] = [
  { id: 'row_count', enable: table, expression: ({ rowCount }) => rowCount },
  { id: 'null_count', enable: column, expression: ({ rowCount, values }) => rowCount - values.length },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ distinct }) => distinct.size,
  },
  { id: 'duplicate_count', enable: column, expression: ({ values, distinct }) => values.length - distinct.size },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ rowCount, distinct, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      if (distinct.size > rowCount * (maxDistinctRatio as number)) return undefined;
      return [...distinct]
        .map(([value, count]) => ({ value: value as string | boolean, count }))
        .sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))
        .slice(0, limit as number);
    },
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: ({ numbers }) => range(numbers, Math.min) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: ({ numbers }) => range(numbers, Math.max) },
  {
    id: 'min_length',
    enable: logicalTypes('string'),
    expression: ({ values }) =>
      range(
        values.map((v) => Array.from(String(v)).length),
        Math.min
      ),
  },
  {
    id: 'max_length',
    enable: logicalTypes('string'),
    expression: ({ values }) =>
      range(
        values.map((v) => Array.from(String(v)).length),
        Math.max
      ),
  },
  {
    id: 'mean',
    enable: logicalTypes('numeric'),
    expression: ({ numbers }) => (numbers.length ? numbers.reduce((sum, n) => sum + n / numbers.length, 0) : null),
  },
  {
    id: 'sum',
    enable: logicalTypes('numeric'),
    expression: ({ numbers }) => (numbers.length ? numbers.reduce((sum, n) => sum + n, 0) : null),
  },
  {
    id: 'stddev',
    enable: logicalTypes('numeric'),
    expression: ({ numbers }) => {
      if (numbers.length < 2) return null;
      const mean = numbers.reduce((sum, n) => sum + n / numbers.length, 0);
      return Math.sqrt(numbers.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (numbers.length - 1));
    },
  },
  {
    id: 'median',
    enable: logicalTypes('numeric'),
    expression: ({ numbers }) => {
      if (!numbers.length) return null;
      const sorted = [...numbers].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : sorted[middle - 1] / 2 + sorted[middle] / 2;
    },
  },
];

function logicalType(type: string): LogicalType {
  if (type === 'number') return 'numeric';
  if (type === 'string' || type === 'boolean' || type === 'date') return type;
  return 'unknown';
}

export function profileTables(data: Record<string, unknown>[], schema: Schema, options: ParsedProfileOptions): Profile {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));
  const compute = (field?: MetricField): Record<string, JsonValue> => {
    const output: Record<string, JsonValue> = {};
    const applicable = metrics.filter(({ definition }) =>
      definition.enable({ target: field ? 'column' : 'table', field })
    );
    if (!applicable.length) return output;
    let values: unknown[] | undefined;
    let numbers: number[] | undefined;
    let distinct: Map<unknown, number> | undefined;
    // Each intermediate is computed once, only when a requested metric reads it.
    const context: Context = {
      rowCount: data.length,
      metric: applicable[0].metric,
      get values() {
        return (values ??= field
          ? data
              .map((row) => row[field.name])
              .filter((value) => value != null)
              .map((value) => {
                if (field.logicalType === 'string') return String(value);
                if (field.logicalType === 'numeric') return Number(value);
                if (field.logicalType === 'date') return new Date(value as string).getTime();
                if (field.logicalType === 'boolean') return value === true || String(value).toLowerCase() === 'true';
                return value;
              })
          : []);
      },
      get numbers() {
        return (numbers ??= this.values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));
      },
      get distinct() {
        if (!distinct) {
          distinct = new Map<unknown, number>();
          for (const value of this.values) {
            // shortcut: Object equality follows JSON key order; canonicalize if unordered equality is required.
            const key = field?.logicalType === 'unknown' ? JSON.stringify(value) : value;
            distinct.set(key, (distinct.get(key) ?? 0) + 1);
          }
        }
        return distinct;
      },
    };
    for (const { metric, definition } of applicable) {
      context.metric = metric;
      const value = definition.expression(context);
      // A later request for the same metric replaces an earlier one, even when skipped.
      delete output[metric.id];
      if (value !== undefined) output[metric.id] = typeof value === 'number' && !Number.isFinite(value) ? null : value;
    }
    return output;
  };
  return {
    models: schema.models.map((source) => ({
      name: source.name,
      metrics: compute(),
      columns: source.columns.map((column) => {
        const field = { ...column, logicalType: logicalType(column.type) };
        return { name: field.name, properties: { logicalType: field.logicalType }, metrics: compute(field) };
      }),
    })),
  };
}
