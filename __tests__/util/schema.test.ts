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
    expect(table.fields).toEqual([
      { name: 'company', type: 'string' },
      { name: 'region', type: 'string' },
      { name: 'revenue', type: 'number' },
    ]);
  });

  it('should handle empty data', () => {
    expect(extractDataSchema([])).toEqual({
      tables: [{ name: 'data', rowCount: 0, columnCount: 0, fields: [], indexes: [] }],
    });
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

  it('should omit unknown row counts while preserving known zero counts', () => {
    const table = { name: 'data', columnCount: 0, fields: [], indexes: [] };
    expect(stringifySchema({ tables: [table] })).not.toContain('Rows:');
    expect(stringifySchema({ tables: [{ ...table, rowCount: 0 }] })).toContain('Rows: 0');
  });

  it('should format arbitrary SQL identifiers without changing their names', () => {
    const schema = extractDataSchema([{ 'replies<gx:number>': 1, '<name>': 'A', 'say"hello': true }]);
    const formatted = stringifySchema(schema, sqlIdentifier);

    expect(formatted).toContain('"replies<gx:number>"');
    expect(formatted).toContain('"<name>"');
    expect(formatted).toContain('"say""hello"');
  });
});
