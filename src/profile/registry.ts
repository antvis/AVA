/**
 * Registry for built-in and custom profile metrics.
 */
import type { Metric } from './types';

const registry = new Map<string, Map<string, Metric>>();

export function registerMetrics<T extends Metric>(engine: string, definitions: T[]): void {
  const metrics = registry.get(engine) ?? new Map<string, Metric>();
  definitions.forEach((definition) => metrics.set(definition.id, definition));
  registry.set(engine, metrics);
}

export function hasMetric(engine: string, id: string): boolean {
  return registry.get(engine)?.has(id) ?? false;
}

export function getMetric<T extends Metric = Metric>(engine: string, id: string): T {
  const metric = registry.get(engine)?.get(id);

  if (!metric) throw new Error(`Unknown metric: ${id}`);
  return metric as T;
}
