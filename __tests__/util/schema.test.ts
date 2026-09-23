import { describe, it, expect } from 'vitest';

import { extractDataSchema } from '../../src/util/schema';

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
