import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/value boundaries', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(n DOUBLE, label VARCHAR)');
  });

  afterEach(() => {
    connection?.closeSync();
    db?.closeSync();
  });

  it.each([
    {
      name: 'empty table',
      rows: '',
      rowCount: 0,
      numeric: { null_count: 0, min: null, max: null, mean: null, stddev: null },
      text: { null_count: 0, min_length: null, max_length: null, top_values: [] },
    },
    {
      name: 'all-null columns',
      rows: '(NULL, NULL)',
      rowCount: 1,
      numeric: { null_count: 1, min: null, max: null, mean: null, stddev: null },
      text: { null_count: 1, min_length: null, max_length: null, top_values: [] },
    },
    {
      name: 'non-finite numbers, a single finite value and Unicode text',
      rows: "('Infinity', '😀'), ('NaN', '😀'), (2, NULL)",
      rowCount: 3,
      numeric: { null_count: 0, min: 2, max: 2, mean: 2, stddev: null },
      text: { null_count: 1, min_length: 1, max_length: 1, top_values: [{ value: '😀', count: 2 }] },
    },
  ])('profiles $name', async ({ rows, rowCount, numeric, text }) => {
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);

    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, {
      metrics: [
        'row_count',
        'null_count',
        'min',
        'max',
        'mean',
        'stddev',
        'min_length',
        'max_length',
        'top_values',
      ].map((id) => ({ id })),
    });

    expect(profile).toEqual({
      models: [
        {
          name: 'samples',
          metrics: { row_count: rowCount },
          columns: [
            { name: 'n', properties: { logicalType: 'numeric' }, metrics: numeric },
            { name: 'label', properties: { logicalType: 'string' }, metrics: text },
          ],
        },
      ],
    });
  });
});
