import { DEFAULT_METRICS } from './builtin';
import { getMetric } from './registry';

import type { MetricConfig, ProfileOptions, ParsedProfileOptions } from './types';

/**
 * Check one metric config and fill in default values.
 */
export function parseMetricConfig(config: MetricConfig): Exclude<MetricConfig, string> {
  const { id, ...configured } = typeof config === 'string' ? { id: config } : config;
  const definition = getMetric(id);
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
export function parseProfileOptions(options: ProfileOptions = {}): ParsedProfileOptions {
  return {
    metrics: (options.metrics ?? DEFAULT_METRICS).map(parseMetricConfig),
  };
}
