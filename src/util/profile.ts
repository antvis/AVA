import type { MetricId, MetricConfig, ProfileOptions, ParsedProfileOptions, LogicalType } from '../contracts/profile';
import type { Schema } from '../contracts/schema';

export type MetricField = Schema['models'][number]['columns'][number] & { logicalType: LogicalType };

export function parseMetricConfig(config: MetricConfig): Exclude<MetricConfig, string> {
  return typeof config === 'string' ? { id: config } : config;
}

/** Resolve a metric definition and validate its supplied options. */
export function resolveMetric<T extends Metric>(config: Exclude<MetricConfig, string>, definitions: T[]): T {
  const definition = definitions.find((metric) => metric.id === config.id);
  if (!definition) throw new Error(`Unknown metric: ${config.id}`);

  const options = definition.options ?? {};
  const unknown = Object.keys(config).find(
    (name) => name !== 'id' && !Object.prototype.hasOwnProperty.call(options, name)
  );
  if (unknown) throw new Error(`Unknown option for ${definition.id}: ${unknown}`);

  for (const [name, option] of Object.entries(options)) {
    const value = config[name] as number;
    if (value !== undefined) {
      option.validate(value);
    }
  }

  return definition;
}

/** Normalize metric selections, using defaults when no selection is supplied. */
export function parseProfileOptions(
  options: ProfileOptions = {},
  defaultOptions: ProfileOptions
): ParsedProfileOptions {
  return {
    metrics: (options.metrics ?? defaultOptions.metrics ?? []).map(parseMetricConfig),
  };
}

export const table: Metric['enable'] = ({ target }) => target === 'table';
export const column: Metric['enable'] = ({ target }) => target === 'column';
export const logicalTypes =
  (...types: LogicalType[]): Metric['enable'] =>
  ({ target, field }) =>
    target === 'column' && !!field && types.includes(field.logicalType);

export const TOP_VALUES_OPTIONS: NonNullable<Metric['options']> = {
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
};

export const DEFAULT_METRICS = ['row_count', 'null_count', 'distinct_count', 'top_values', 'min', 'max', 'mean'];

/**
 * The rules for one metric option.
 */
export type MetricOption = {
  /** Throws if the value is not allowed. */
  validate(value: number): void;
};

/**
 * A metric, its rules, and its engine-specific implementation.
 */
export type Metric<Expression = unknown> = {
  /** The metric name. */
  id: MetricId;
  /** The implementation interpreted by the registered engine. */
  expression: Expression;
  /** Returns true if the metric applies to this target. */
  enable: (context: {
    /** The kind of target to check. */
    target: 'table' | 'column';
    /** Field details for a column target. */
    field?: {
      /** The field type shared by all engines. */
      logicalType: LogicalType;
    };
  }) => boolean;
  /** Option rules keyed by option name. */
  options?: Record<string, MetricOption>;
};
