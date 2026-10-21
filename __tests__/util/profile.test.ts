import { describe, expect, it } from 'vitest';

import { BUILTIN_METRICS } from '../../src/duckdb/profile';
import { resolveMetric, profileMetadataSchema } from '../../src/util/profile';

import type { Profile, Schema } from '../../src/types';

const schema: Schema = {
  models: [{ name: 'data', tableReference: { table: 'data' }, columns: [{ name: 'value', type: 'number' }] }],
};
const profile: Profile = {
  models: schema.models.map((table) => ({
    name: table.name,
    metrics: { row_count: 2 },
    columns: table.columns.map((field) => ({
      name: field.name,
      properties: { logicalType: 'numeric' },
      metrics: { mean: null, min: 0, custom: [false, { example: 'a' }] },
    })),
  })),
};

describe('resolveMetric', () => {
  it('returns the selected definition after validating its options', () => {
    expect(resolveMetric({ id: 'row_count' }, BUILTIN_METRICS)).toBe(BUILTIN_METRICS[0]);
    expect(resolveMetric({ id: 'top_values', limit: 2, maxDistinctRatio: 0.5 }, BUILTIN_METRICS).id).toBe('top_values');
  });

  it.each([
    { config: { id: 'missing' }, error: 'Unknown metric: missing' },
    { config: { id: 'row_count', limit: 2 }, error: 'Unknown option for row_count: limit' },
    { config: { id: 'top_values', limit: -1 }, error: 'top_values.limit' },
    { config: { id: 'top_values', limit: 1.5 }, error: 'top_values.limit' },
    { config: { id: 'top_values', maxDistinctRatio: 2 }, error: 'top_values.maxDistinctRatio' },
    { config: { id: 'top_values', maxDistinctRatio: NaN }, error: 'top_values.maxDistinctRatio' },
  ])('rejects invalid configuration $config', ({ config, error }) => {
    expect(() => resolveMetric(config, BUILTIN_METRICS)).toThrow(error);
  });
});

describe('profileMetadataSchema', () => {
  it('round trips profiles and snapshots nested metric values', () => {
    const parsed = profileMetadataSchema.parse(JSON.parse(JSON.stringify(profile)));
    expect(parsed).toEqual(profile);
    const snapshot = profileMetadataSchema.parse(profile);
    expect(snapshot).toEqual(profile);
    expect(snapshot.models[0].columns[0].metrics.custom).not.toBe(profile.models[0].columns[0].metrics.custom);
  });

  it('requires models and rejects unknown profile properties', () => {
    expect(() => profileMetadataSchema.parse({ tables: [] })).toThrow();
    expect(() => profileMetadataSchema.parse({ ...profile, generatedAt: 0 })).toThrow();
  });

  it.each([Infinity, undefined, () => 1, BigInt(1)])('rejects non-JSON metric values %#', (value) => {
    const input = structuredClone(profile);
    input.models[0].metrics.custom = value;
    expect(() => profileMetadataSchema.parse(input)).toThrow();
  });

  it('accepts omitted statistics without inventing observations', () => {
    const input = structuredClone(profile);
    input.models[0].metrics = {};
    input.models[0].columns[0].metrics = {};
    expect(profileMetadataSchema.parse(input)).toEqual(input);
  });
});
