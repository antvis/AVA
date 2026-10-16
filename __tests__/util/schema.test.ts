import { describe, it, expect } from 'vitest';

import { extractDataSchema, schemaMetadataSchema } from '../../src/util/schema';

import type { Profile, Schema } from '../../src/types';

const schema: Schema = {
  tables: [{ name: 'data', columnCount: 1, fields: [{ name: 'value', type: 'number' }], indexes: [] }],
  relations: [
    { kind: 'foreign-key', from: { table: 'data', columns: ['value'] }, to: { table: 'data', columns: ['value'] } },
  ],
};
const profile: Profile = {
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

describe('extractDataSchema', () => {
  it('should extract schema from an object array', () => {
    const data = [
      { company: 'A', region: 'East', revenue: 100 },
      { company: 'B', region: 'West', revenue: 200 },
    ];

    const schema = extractDataSchema(data);

    expect(schema.tables).toHaveLength(1);
    const table = schema.tables[0];
    expect(table.name).toBe('data');
    expect(table.columnCount).toBe(3);
    expect(table.fields).toEqual([
      { name: 'company', type: 'string' },
      { name: 'region', type: 'string' },
      { name: 'revenue', type: 'number' },
    ]);
  });

  it('should handle empty data', () => {
    expect(extractDataSchema([])).toEqual({
      tables: [{ name: 'data', columnCount: 0, fields: [], indexes: [] }],
    });
  });
});

describe('schemaMetadataSchema', () => {
  it('extracts pure structure from profiles and CLI schema output', () => {
    expect(schemaMetadataSchema.parse(profile)).toEqual(schema);
    expect(schemaMetadataSchema.parse({ ...schema, language: { name: 'JavaScript', fence: 'js' } })).toEqual(schema);
    expect(schemaMetadataSchema.parse({ tables: [] })).toEqual({ tables: [] });
  });

  it('checks field formats without verifying schema consistency', () => {
    const input = structuredClone(schema);
    input.tables[0].columnCount = 100;
    input.relations![0].to.table = 'not verified';
    expect(schemaMetadataSchema.parse(input)).toEqual(input);
    expect(() => schemaMetadataSchema.parse({ tables: [{ ...schema.tables[0], fields: 'invalid' }] })).toThrow();
    expect(() => schemaMetadataSchema.parse({ tables: [{ ...schema.tables[0], columnCount: -1 }] })).toThrow();
  });
});
