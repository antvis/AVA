import type { FieldMetadata, Schema, TableSchema } from '../types';

/**
 * A field type shared by all engines.
 */
export type LogicalType = 'numeric' | 'string' | 'boolean' | 'date' | 'unknown';

/**
 * The name used to register and select a metric.
 */
export type MetricId = string;

/**
 * The rules for one metric option.
 */
export type MetricOption = {
  /** The value type. */
  type: 'number';
  /** The value used when the option is not set. */
  default: number;
  /** Throws if the value is not allowed. */
  validate(value: number): void;
};

/**
 * A metric and its rules.
 */
export type Metric = {
  /** The metric name. */
  id: MetricId;
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

/**
 * A selected metric, with optional values.
 */
export type MetricConfig =
  | MetricId
  | {
      /** The metric name. */
      id: MetricId;
      /** Option values checked against the metric rules. The id key is reserved. */
      [name: string]: unknown;
    };

/**
 * A category value and its count.
 */
export interface MetricFrequency {
  /** The category value. */
  value: string | boolean;
  /** The number of times the value occurs. */
  count: number;
}

/**
 * A field and its metric results.
 */
export type FieldProfile = FieldMetadata & {
  /** The field type shared by all engines. */
  logicalType: LogicalType;
  /** Results keyed by metric name. Missing results were not computed. */
  metrics: Record<string, unknown>;
};

/**
 * A table and its metric results.
 */
export type TableProfile = Omit<TableSchema, 'fields'> & {
  /** Fields with their metric results. */
  fields: FieldProfile[];
  /** Table results keyed by metric name. */
  metrics: Record<string, unknown>;
};

/**
 * The schema with metric results.
 */
export type Profile = Omit<Schema, 'tables'> & {
  /** Tables with their metric results. */
  tables: TableProfile[];
  /** The creation time in milliseconds since the Unix epoch. */
  generatedAt: number;
};

/**
 * Options for a profile run.
 */
export interface ProfileOptions {
  /** Metrics to compute. Uses the default set if omitted. */
  metrics?: MetricConfig[];
}

/**
 * Checked options ready for an engine to use.
 */
export interface ParsedProfileOptions {
  /** Checked metric configs with defaults filled in. */
  metrics: Exclude<MetricConfig, string>[];
}
