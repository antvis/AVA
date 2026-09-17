/**
 * Unit tests for util/schema
 */

import { describe, it, expect } from 'vitest';

import { extractDataSchema, stringifySchema } from '../../src/util/schema';

describe('extractDataSchema', () => {
  it('should extract schema from an object array', () => {
    const data = [
      { company: 'A', region: 'East', revenue: 100 },
      { company: 'B', region: 'West', revenue: 200 },
    ];

    const schema = extractDataSchema(data);

    expect(schema.rowCount).toBe(2);
    expect(schema.columnCount).toBe(3);
    expect(schema.fields.find(f => f.name === 'company')?.type).toBe('string');
    expect(schema.fields.find(f => f.name === 'revenue')?.type).toBe('number');
  });

  it('should handle empty data', () => {
    const schema = extractDataSchema([]);
    expect(schema).toEqual({ rowCount: 0, columnCount: 0, fields: [] });
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
});
