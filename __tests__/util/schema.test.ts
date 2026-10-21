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
  it('infers scalar types, nullable fields and object values in input column order', () => {
    const data = [
      { name: 'A', amount: 10, flag: true, day: '2024-01-01', extra: { tag: 'x' }, empty: null },
      { name: 'B', amount: null, flag: 'false', day: '2024-01-02', extra: null, empty: '' },
    ];

    expect(extractDataSchema(data)).toEqual({
      models: [
        {
          name: 'data',
          tableReference: { table: 'data' },
          columns: [
            { name: 'name', type: 'string' },
            { name: 'amount', type: 'number' },
            { name: 'flag', type: 'boolean' },
            { name: 'day', type: 'date' },
            { name: 'extra', type: 'unknown' },
            { name: 'empty', type: 'string' },
          ],
        },
      ],
    });
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
