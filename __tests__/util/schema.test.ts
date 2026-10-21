import { describe, it, expect } from 'vitest';

import { extractDataSchema, schemaMetadataSchema } from '../../src/util/schema';

import type { Profile, Schema } from '../../src/types';

const schema: Schema = {
  models: [{ name: 'data', columns: [{ name: 'value', type: 'number' }], tableReference: { table: 'data' } }],
  relationships: [
    {
      name: 'fk:["data",["value"],"data",["value"]]',
      models: ['data', 'data'],
      joinType: 'MANY_TO_ONE',
      condition: '"data"."value" = "data"."value"',
    },
  ],
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

describe('extractDataSchema', () => {
  it('should extract schema from an object array', () => {
    const data = [
      { company: 'A', region: 'East', revenue: 100 },
      { company: 'B', region: 'West', revenue: 200 },
    ];

    const schema = extractDataSchema(data);

    expect(schema.models).toHaveLength(1);
    const table = schema.models[0];
    expect(table.name).toBe('data');
    expect(table.columns).toHaveLength(3);
    expect(table.columns).toEqual([
      { name: 'company', type: 'string' },
      { name: 'region', type: 'string' },
      { name: 'revenue', type: 'number' },
    ]);
  });

  it('should handle empty data', () => {
    expect(extractDataSchema([])).toEqual({
      models: [{ name: 'data', columns: [], tableReference: { table: 'data' } }],
    });
  });
});

describe('schemaMetadataSchema', () => {
  it('rejects independent profiles and accepts CLI schema output', () => {
    expect(() => schemaMetadataSchema.parse(profile)).toThrow();
    expect(schemaMetadataSchema.parse({ ...schema, language: { name: 'JavaScript', fence: 'js' } })).toEqual(schema);
    expect(schemaMetadataSchema.parse({ models: [] })).toEqual({ models: [] });
  });

  it('checks field formats without verifying schema consistency', () => {
    const input = structuredClone(schema);
    input.models[0].columns[0].name = 'renamed';
    input.relationships![0].models[1] = 'not verified';
    expect(schemaMetadataSchema.parse(input)).toEqual(input);
    expect(() => schemaMetadataSchema.parse({ models: [{ ...schema.models[0], columns: 'invalid' }] })).toThrow();
    expect(() =>
      schemaMetadataSchema.parse({ models: [{ ...schema.models[0], tableReference: undefined }] })
    ).toThrow();
  });
});
