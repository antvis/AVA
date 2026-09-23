import type { Metric, MetricConfig, ProfileOptions, ParsedProfileOptions } from '../types';

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
    if (value) {
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
  if (!options.metrics) {
    options.metrics = defaultOptions.metrics;
  }

  return {
    metrics: (options.metrics ?? []).map((config) => parseMetricConfig(config)),
  };
}
