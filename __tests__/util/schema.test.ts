/**
 * Unit tests for util/schema
 */

import { describe, it, expect } from 'vitest';

import { extractDataSchema, stringifySchema } from '../../src/util/schema';
import { sqlIdentifier } from '../../src/util/sql';

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
    expect(table.rowCount).toBe(2);
    expect(table.columnCount).toBe(3);
    expect(table.fields.find((f) => f.name === 'company')?.type).toBe('string');
    expect(table.fields.find((f) => f.name === 'revenue')?.type).toBe('number');
  });

  it('should handle empty data', () => {
    expect(extractDataSchema([])).toEqual({ tables: [{ name: 'data', columnCount: 0, fields: [], indexes: [] }] });
  });
});

describe('stringifySchema', () => {
  it('should format a schema as a multi-line description', () => {
    const schema = extractDataSchema([{ company: 'A', revenue: 100 }]);
    const formatted = stringifySchema(schema);

    expect(formatted).toContain('Dataset Info:');
    expect(formatted).toContain('company');
    expect(formatted).toContain('revenue');
  });

  it('should format arbitrary SQL identifiers without changing their names', () => {
    const schema = extractDataSchema([{ 'replies<gx:number>': 1, '<name>': 'A', 'say"hello': true }]);
    const formatted = stringifySchema(schema, sqlIdentifier);

    expect(formatted).toContain('"replies<gx:number>"');
    expect(formatted).toContain('"<name>"');
    expect(formatted).toContain('"say""hello"');
  });
});
