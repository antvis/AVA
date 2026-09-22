/**
 * Unit tests for util/schema
 */

import * as path from 'path';

import { describe, it, expect } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { getDuckDBSchema } from '../../src/duckdb/util/schema';
import { extractDataSchema, stringifySchema } from '../../src/util/schema';
import { sqlStringLiteral } from '../../src/util/sql';

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
  it('stringifies the sales CSV schema as a structural description', async () => {
    const db = await DuckDBInstance.create(':memory:');
    try {
      const conn = await db.connect();
      try {
        const csvPath = path.join(__dirname, '../datasets/sales.csv');
        await conn.run(`CREATE TABLE sales AS SELECT * FROM read_csv_auto(${sqlStringLiteral(csvPath)})`);

        const schema = await getDuckDBSchema(conn, ['sales']);

        expect(stringifySchema(schema)).toBe(`Dataset Info: 1 table(s)
Table "sales":
- Columns: 12
Fields:
- "order_id" (VARCHAR)
- "order_date" (DATE)
- "region" (VARCHAR)
- "category" (VARCHAR)
- "product" (VARCHAR)
- "channel" (VARCHAR)
- "quantity" (BIGINT)
- "unit_price" (DOUBLE)
- "discount" (DOUBLE)
- "sales" (DOUBLE)
- "cost" (DOUBLE)
- "profit" (DOUBLE)

`);
      } finally {
        conn.closeSync();
      }
    } finally {
      db.closeSync();
    }
  });

  it('should format arbitrary SQL identifiers without changing their names', () => {
    const schema = extractDataSchema([{ 'replies<gx:number>': 1, '<name>': 'A', 'say"hello': true }]);
    const formatted = stringifySchema(schema);

    expect(formatted).toContain('"replies<gx:number>"');
    expect(formatted).toContain('"<name>"');
    expect(formatted).toContain('"say""hello"');
  });
});
