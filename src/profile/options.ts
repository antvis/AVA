import type { Metric, MetricConfig, ProfileOptions, ParsedProfileOptions } from '../types';

/**
 * Check one metric config and fill in default values.
 */
export function parseMetricConfig(definitions: Metric[], config: MetricConfig): Exclude<MetricConfig, string> {
  const { id, ...configured } = typeof config === 'string' ? { id: config } : config;
  const definition = definitions.find((metric) => metric.id === id);
  if (!definition) throw new Error(`Unknown metric: ${id}`);
  const options = definition.options ?? {};

  const unknown = Object.keys(configured).find((name) => !Object.prototype.hasOwnProperty.call(options, name));
  if (unknown) throw new Error(`Unknown option for ${definition.id}: ${unknown}`);

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
  definitions: Metric[] = [],
  defaultMetrics: MetricConfig[] = []
): ParsedProfileOptions {
  return {
    metrics: (options.metrics ?? defaultMetrics).map((config) => parseMetricConfig(definitions, config)),
  };
}
