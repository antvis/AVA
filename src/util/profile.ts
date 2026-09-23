import type { Metric, MetricConfig, ProfileOptions, ParsedProfileOptions } from '../types';

/**
 * Check one metric config and fill in default values.
 */
export function parseMetricConfig(definitions: Metric[], config: MetricConfig): Exclude<MetricConfig, string> {
  const { id, ...configured } = typeof config === 'string' ? { id: config } : config;

  // Check if the metric is available
  const definition = definitions.find((metric) => metric.id === id);
  if (!definition) throw new Error(`Unknown metric: ${id}`);

  // Check if option names are valid for the metric
  const options = definition.options ?? {};
  const unknown = Object.keys(configured).find((name) => !Object.prototype.hasOwnProperty.call(options, name));
  if (unknown) throw new Error(`Unknown option for ${definition.id}: ${unknown}`);

  // Check option value types and constraints after applying defaults
  const resolved: Record<string, number> = {};
  for (const [name, option] of Object.entries(options)) {
    const value = configured[name] === undefined ? option.default : configured[name];
    if (typeof value !== 'number') {
      throw new Error(`${definition.id}.${name} must be a ${option.type}`);
    }
    option.validate(value);
    resolved[name] = value;
  }
  return {
    ...resolved,
    id,
  };
}

/**
 * Resolve defaults and validate options before any metric computation.
 */
export function parseProfileOptions(
  options: ProfileOptions = {},
  defaultOptions: ProfileOptions,
  definitions: Metric[] = []
): ParsedProfileOptions {
  if (!options.metrics) {
    options.metrics = defaultOptions.metrics;
  }

  return {
    metrics: (options.metrics ?? []).map((config) => parseMetricConfig(definitions, config)),
  };
}
