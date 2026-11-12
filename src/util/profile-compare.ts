import { profileOutputSchema } from '../contracts';

import type { JsonValue } from '../types';

function align<T extends { name: string }>(before: T[], after: T[]) {
  const left = new Map(before.map((item) => [item.name, item]));
  const right = new Map(after.map((item) => [item.name, item]));
  if (left.size !== before.length || right.size !== after.length) {
    throw new Error('Profile comparison requires unique model and column names');
  }
  return [...new Set([...left.keys(), ...right.keys()])].map((name) => ({
    name,
    before: left.get(name),
    after: right.get(name),
  }));
}

function compareMetrics(before: Record<string, JsonValue> = {}, after: Record<string, JsonValue> = {}) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].map((name) => {
    const left = Object.prototype.hasOwnProperty.call(before, name) ? before[name] : undefined;
    const right = Object.prototype.hasOwnProperty.call(after, name) ? after[name] : undefined;
    const delta = typeof left === 'number' && typeof right === 'number' ? right - left : undefined;
    return { name, before: left, after: right, ...(Number.isFinite(delta) && { delta }) };
  });
}

/** Align saved profile observations without reading either dataset again. */
export function compareProfiles(before: unknown, after: unknown) {
  const left = profileOutputSchema.parse(before);
  const right = profileOutputSchema.parse(after);
  if (left.semantics !== right.semantics) throw new Error('Profile comparison requires matching metric semantics');

  return {
    models: align(left.models, right.models).map(({ name, before, after }) => ({
      name,
      before: before !== undefined,
      after: after !== undefined,
      metrics: compareMetrics(before?.metrics, after?.metrics),
      columns: align(before?.columns ?? [], after?.columns ?? []).map(({ name, before, after }) => ({
        name,
        before: before?.properties,
        after: after?.properties,
        metrics: compareMetrics(before?.metrics, after?.metrics),
      })),
    })),
  };
}

export type ProfileComparison = ReturnType<typeof compareProfiles>;
