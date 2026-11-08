import { z } from 'zod';

import { jsonValue } from './json';

const logicalTypeSchema = z.enum(['numeric', 'string', 'boolean', 'date', 'unknown']);
const columnSchema = z.object({
  name: z.string(),
  metrics: z.record(z.string(), jsonValue),
  properties: z.object({ logicalType: logicalTypeSchema }),
});
const modelSchema = z.object({
  name: z.string(),
  metrics: z.record(z.string(), jsonValue),
  columns: z.array(columnSchema),
});

export const profileMetadataSchema = z.object({ models: z.array(modelSchema) }).strict();

// Assembly rejects unsupported nested fields instead of silently discarding them.
export const profileInputSchema = profileMetadataSchema.extend({
  models: z.array(
    modelSchema.strict().extend({
      name: modelSchema.shape.name.min(1),
      columns: z.array(
        columnSchema.strict().extend({
          name: columnSchema.shape.name.min(1),
          properties: columnSchema.shape.properties.strict(),
        })
      ),
    })
  ),
});

/**
 * A field type shared by all engines.
 */
export type LogicalType = z.infer<typeof logicalTypeSchema>;

/**
 * The name used to register and select a metric.
 */
export type MetricId = string;

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

/** Observations matched to models and columns by name, independently of catalog discovery. */
export type Profile = z.infer<typeof profileMetadataSchema>;
