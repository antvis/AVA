import { z } from 'zod';

import { jsonValue, schemaStructure } from './schema';

import type {
  Metric,
  MetricConfig,
  ProfileOptions,
  ParsedProfileOptions,
  LogicalType,
  Profile,
  DataSourceMetadata,
} from '../types';

const tableStructure = schemaStructure.shape.tables.element;
export const profileMetadataSchema = schemaStructure
  .extend({
    generatedAt: z.number().int().min(0).max(8_640_000_000_000_000),
    tables: z.array(
      tableStructure.extend({
        metrics: z.record(jsonValue),
        fields: z.array(
          tableStructure.shape.fields.element.extend({
            logicalType: z.enum(['numeric', 'string', 'boolean', 'date', 'unknown']),
            metrics: z.record(jsonValue),
          })
        ),
      })
    ),
  })
  .transform((value) => value as Profile);

export function toProfile(metadata: DataSourceMetadata): Profile | null {
  const result = profileMetadataSchema.safeParse(metadata.profile);
  return result.success ? result.data : null;
}

export function parseMetricConfig(config: MetricConfig): Exclude<MetricConfig, string> {
  return typeof config === 'string' ? { id: config } : config;
}

export function validateMetricConfig(config: Exclude<MetricConfig, string>, definitions: Metric[]) {
  // Check if the metric is available
  const definition = definitions.find((metric) => metric.id === config.id);
  if (!definition) throw new Error(`Unknown metric: ${config.id}`);

  // Check if option names are valid for the metric
  const options = definition.options ?? {};
  const unknown = Object.keys(config).find(
    (name) => name !== 'id' && !Object.prototype.hasOwnProperty.call(options, name)
  );
  if (unknown) throw new Error(`Unknown option for ${definition.id}: ${unknown}`);

  // Check option value types and constraints after applying defaults
  for (const [name, option] of Object.entries(options)) {
    const value = config[name] as number;
    if (value !== undefined) {
      option.validate(value);
    }
  }

  return true;
}

/**
 * Resolve defaults and validate options before any metric computation.
 */
export function parseProfileOptions(
  options: ProfileOptions = {},
  defaultOptions: ProfileOptions
): ParsedProfileOptions {
  return {
    metrics: (options.metrics ?? defaultOptions.metrics ?? []).map((config) => parseMetricConfig(config)),
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
