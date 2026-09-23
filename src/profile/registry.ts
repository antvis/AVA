/**
 * Registry for built-in and custom profile metrics.
 */
import type { Metric } from './types';

const registry = new Map<string, Metric>();

export function registerMetric(definition: Metric): void {
  registry.set(definition.id, definition);
}

export function hasMetric(id: string): boolean {
  return registry.has(id);
}

export function getMetric(id: string): Metric {
  const metric = registry.get(id);

  if (!metric) throw new Error(`Unknown metric: ${id}`);
  return metric;
}
