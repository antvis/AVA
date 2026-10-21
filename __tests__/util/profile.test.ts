import { describe, expect, it } from 'vitest';

import { BUILTIN_METRICS } from '../../src/duckdb/profile';
import { validateMetricConfig, profileMetadataSchema } from '../../src/util/profile';

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

it('validates metric options without treating the metric id as an option', () => {
  expect(validateMetricConfig({ id: 'row_count' }, BUILTIN_METRICS)).toBe(true);
  expect(validateMetricConfig({ id: 'top_values', limit: 2 }, BUILTIN_METRICS)).toBe(true);
  expect(() => validateMetricConfig({ id: 'row_count', limit: 2 }, BUILTIN_METRICS)).toThrow(
    'Unknown option for row_count: limit'
  );
  expect(() => validateMetricConfig({ id: 'top_values', limit: -1 }, BUILTIN_METRICS)).toThrow(
    'top_values.limit must be a non-negative safe integer'
  );
});

describe('profileMetadataSchema', () => {
  it('round trips profiles and snapshots nested metric values', () => {
    const parsed = profileMetadataSchema.parse(JSON.parse(JSON.stringify(profile)));
    expect(parsed).toEqual(profile);
    const snapshot = profileMetadataSchema.parse(profile);
    expect(snapshot).toEqual(profile);
    expect(snapshot.models[0].columns[0].metrics.custom).not.toBe(profile.models[0].columns[0].metrics.custom);
  });

  it('rejects the obsolete profile shape', () => {
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
