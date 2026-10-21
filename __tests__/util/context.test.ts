import * as path from 'path';

import { describe, it, expect } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { DEFAULT_METRICS, profileTables } from '../../src/duckdb/profile';
import { getDuckDBSchema } from '../../src/duckdb/util/schema';
import { stringifySchema, stringifyProfile } from '../../src/util/context';
import { extractDataSchema } from '../../src/util/schema';
import { sqlStringLiteral } from '../../src/util/sql';

import type { Profile, Schema } from '../../src/types';

describe('context', () => {
  it('describes catalog structure and independent observations from the sales CSV', async () => {
    const db = await DuckDBInstance.create(':memory:');
    const conn = await db.connect();
    try {
      const csvPath = path.join(__dirname, '../datasets/sales.csv');
      await conn.run(`CREATE TABLE sales AS SELECT * FROM read_csv_auto(${sqlStringLiteral(csvPath)})`);
      const schema = await getDuckDBSchema(conn, ['sales']);
      expect(JSON.parse(stringifySchema(schema).split('\n').slice(1).join('\n'))).toEqual(schema);
      const profile = await profileTables(conn, schema, { metrics: DEFAULT_METRICS.map((id) => ({ id })) });
      expect(stringifyProfile(profile)).toMatchSnapshot();
      expect(profile).not.toHaveProperty('generatedAt');
      expect(profile.models[0].columns[0]).not.toHaveProperty('type');
    } finally {
      conn.closeSync();
      db.closeSync();
    }
  });

  it('preserves composite keys, relationships, views and arbitrary identifiers in schema descriptions', () => {
    const schema: Schema = {
      models: [
        {
          name: 'customer"accounts',
          tableReference: { catalog: 'sales', schema: 'public', table: 'customer"accounts' },
          columns: [
            { name: 'tenant id', type: 'INTEGER', notNull: true },
            { name: 'customer"id', type: 'BIGINT' },
          ],
          primaryKey: ['tenant id', 'customer"id'],
          uniqueKeys: ['customer"id'],
        },
      ],
      relationships: [
        {
          name: 'self',
          models: ['customer"accounts', 'customer"accounts'],
          joinType: 'ONE_TO_ONE',
          condition: 'source.id = target.id',
        },
      ],
      views: [{ name: 'all', statement: 'SELECT * FROM "customer""accounts"' }],
    };
    expect(JSON.parse(stringifySchema(schema).split('\n').slice(1).join('\n'))).toEqual(schema);
    const names = extractDataSchema([{ 'replies<gx:number>': 1, '<name>': 'A', 'say"hello': true }]);
    expect(JSON.parse(stringifySchema(names).split('\n').slice(1).join('\n'))).toEqual(names);
  });

  it('distinguishes missing, null, zero and empty observations', () => {
    const profile: Profile = {
      models: [
        {
          name: 'items',
          metrics: { row_count: 0 },
          columns: [
            { name: 'id', properties: { logicalType: 'numeric' }, metrics: { min: null, null_count: 0 } },
            { name: 'label', properties: { logicalType: 'string' }, metrics: { top_values: [], custom_metric: 0 } },
            { name: 'parent', properties: { logicalType: 'numeric' }, metrics: {} },
          ],
        },
      ],
    };
    const text = stringifyProfile(profile);
    expect(text).toContain('Observed rows: 0');
    expect(text).toContain(
      '- "id"\n  Logical type: numeric\n  Minimum: null (no usable aggregate value)\n  Null values: 0'
    );
    expect(text).toContain('Most frequent non-null values (value, row count): []');
    expect(text).toContain('custom_metric: 0');
    expect(text).toContain('- "parent"\n  Logical type: numeric\n  Observations: not provided.');
    expect(text).not.toContain('Mean:');
  });
});
