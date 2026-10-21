import { describe, expect, it } from 'vitest';

import { BUILTIN_METRICS } from '../../src/duckdb/profile';
import { validateMetricConfig, profileMetadataSchema } from '../../src/util/profile';

import type { OldProfile, OldSchema } from '../../src/types';

const schema: OldSchema = {
  tables: [{ name: 'data', columnCount: 1, fields: [{ name: 'value', type: 'number' }], indexes: [] }],
  relations: [
    { kind: 'foreign-key', from: { table: 'data', columns: ['value'] }, to: { table: 'data', columns: ['value'] } },
  ],
};
const profile: OldProfile = {
  ...schema,
  generatedAt: 1234,
  tables: schema.tables.map((table) => ({
    ...table,
    metrics: { row_count: 2 },
    fields: table.fields.map((field) => ({
      ...field,
      logicalType: 'numeric',
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
    expect(snapshot.tables[0].fields[0].metrics.custom).not.toBe(profile.tables[0].fields[0].metrics.custom);
  });

  it.each([NaN, Infinity, -1, 8_640_000_000_000_001, '2026-01-01'])('rejects invalid generatedAt %s', (generatedAt) => {
    expect(() => profileMetadataSchema.parse({ ...profile, generatedAt })).toThrow();
  });

  it.each([Infinity, undefined, () => 1, BigInt(1)])('rejects non-JSON metric values %#', (value) => {
    const input = structuredClone(profile);
    input.tables[0].metrics.custom = value;
    expect(() => profileMetadataSchema.parse(input)).toThrow();
  });

  it('accepts omitted statistics without inventing observations', () => {
    const input = structuredClone(profile);
    input.tables[0].metrics = {};
    input.tables[0].fields[0].metrics = {};
    expect(profileMetadataSchema.parse(input)).toEqual(input);
  });
});
