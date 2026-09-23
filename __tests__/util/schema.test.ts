/**
 * Unit tests for util/schema
 */

import * as path from 'path';

import { describe, it, expect } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { getDuckDBSchema } from '../../src/duckdb/util/schema';
import { extractDataSchema, stringifySchema } from '../../src/util/schema';
import { sqlStringLiteral } from '../../src/util/sql';

import type { Schema } from '../../src/types';

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

  it('formats a complex multi-table schema with indexes and only valid declared relations', () => {
    // Explicit metadata keeps this formatter test independent of database discovery.
    const schema: Schema = {
      tables: [
        {
          name: 'customer"accounts',
          columnCount: 4,
          fields: [
            { name: 'tenant id', type: 'INTEGER', nullable: false },
            { name: 'customer"id', type: 'BIGINT', nullable: false },
            { name: 'email', type: 'VARCHAR', nullable: true },
            { name: 'profile', type: 'STRUCT(city VARCHAR, tags VARCHAR[])' },
          ],
          indexes: [
            { name: 'pk"customers', columns: ['tenant id', 'customer"id'], primary: true, unique: true },
            { name: 'unique email', columns: ['tenant id', 'email'], primary: false, unique: true },
          ],
        },
        {
          name: 'orders',
          columnCount: 6,
          fields: [
            { name: 'order_id', type: 'BIGINT', nullable: false },
            { name: 'tenant_id', type: 'INTEGER', nullable: false },
            { name: 'customer_id', type: 'BIGINT', nullable: false },
            { name: 'parent_id', type: 'BIGINT', nullable: true },
            { name: 'amount', type: 'DECIMAL(10,2)', nullable: false },
            { name: 'placed_at', type: 'TIMESTAMP WITH TIME ZONE' },
          ],
          indexes: [
            { name: 'orders_pkey', columns: ['order_id'], primary: true, unique: true },
            { name: 'idx customer', columns: ['tenant_id', 'customer_id'], primary: false, unique: false },
          ],
        },
        {
          name: 'empty archive',
          columnCount: 1,
          fields: [{ name: 'note', type: 'VARCHAR', nullable: true }],
          indexes: [],
        },
      ],
      relations: [
        {
          name: 'fk"customer',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['tenant_id', 'customer_id'] },
          to: { table: 'customer"accounts', columns: ['tenant id', 'customer"id'] },
        },
        // Unnamed self-reference is valid and must not gain an undefined label.
        {
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['parent_id'] },
          to: { table: 'orders', columns: ['order_id'] },
        },
        // Invalid declarations must not leak into the LLM's schema description.
        {
          name: 'missing_table',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['customer_id'] },
          to: { table: 'hidden_customers', columns: ['id'] },
        },
        {
          name: 'missing_column',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['unknown_id'] },
          to: { table: 'orders', columns: ['order_id'] },
        },
        {
          name: 'mismatched_columns',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['tenant_id', 'customer_id'] },
          to: { table: 'customer"accounts', columns: ['customer"id'] },
        },
        {
          name: 'duplicate_columns',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['customer_id', 'customer_id'] },
          to: { table: 'customer"accounts', columns: ['tenant id', 'customer"id'] },
        },
        {
          name: 'empty_columns',
          kind: 'foreign-key',
          from: { table: 'orders', columns: [] },
          to: { table: 'orders', columns: [] },
        },
      ],
    };

    expect(stringifySchema(schema)).toBe(`Dataset Info: 3 table(s)
Table "customer""accounts":
- Columns: 4
Fields:
- "tenant id" (INTEGER) NOT NULL
- "customer""id" (BIGINT) NOT NULL
- "email" (VARCHAR)
- "profile" (STRUCT(city VARCHAR, tags VARCHAR[]))
Indexes:
  - PRIMARY KEY "pk""customers" ("tenant id", "customer""id")
  - UNIQUE "unique email" ("tenant id", "email")
Table "orders":
- Columns: 6
Fields:
- "order_id" (BIGINT) NOT NULL
- "tenant_id" (INTEGER) NOT NULL
- "customer_id" (BIGINT) NOT NULL
- "parent_id" (BIGINT)
- "amount" (DECIMAL(10,2)) NOT NULL
- "placed_at" (TIMESTAMP WITH TIME ZONE)
Indexes:
  - PRIMARY KEY "orders_pkey" ("order_id")
  - "idx customer" ("tenant_id", "customer_id")
Table "empty archive":
- Columns: 1
Fields:
- "note" (VARCHAR)

Relations (declared; pair columns by position):
  - [foreign-key] "fk""customer": "orders" ("tenant_id", "customer_id") REFERENCES "customer""accounts" ("tenant id", "customer""id")
  - [foreign-key] "orders" ("parent_id") REFERENCES "orders" ("order_id")

Notes:
- For joins, prefer the declared relations and match ALL paired columns of composite relations.
- These relations describe database foreign-key constraints, which do not imply one-to-one cardinality; avoid double-counting when aggregating across joins.
- Choose the JOIN type according to the question and nullability.
- Missing declarations mean relations are unknown, not that same-named columns are related.
- Only reference tables exposed in this schema.
`);
  });

  it('should format arbitrary SQL identifiers without changing their names', () => {
    const schema = extractDataSchema([{ 'replies<gx:number>': 1, '<name>': 'A', 'say"hello': true }]);
    const formatted = stringifySchema(schema);

    expect(formatted).toContain('"replies<gx:number>"');
    expect(formatted).toContain('"<name>"');
    expect(formatted).toContain('"say""hello"');
  });
});
