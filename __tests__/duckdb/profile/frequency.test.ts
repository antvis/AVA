import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/value frequencies', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const metrics = ['value_counts', 'mode', 'mode_count'].map((id) => ({ id }));

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it.each([
    {
      type: 'VARCHAR',
      rows: "('z'), ('a'), ('a'), ('z'), ('rare'), (NULL)",
      expected: [
        ['a', 2],
        ['z', 2],
        ['rare', 1],
      ],
    },
    {
      type: 'BOOLEAN',
      rows: '(true), (true), (false), (NULL)',
      expected: [
        [true, 2],
        [false, 1],
      ],
    },
    {
      type: 'DATE',
      rows: "('infinity'), ('2024-01-01'), ('infinity')",
      expected: [
        ['infinity', 2],
        ['2024-01-01', 1],
      ],
    },
    {
      type: 'BIGINT',
      rows: '(9007199254740992), (9007199254740993), (9007199254740993)',
      expected: [
        ['9007199254740993', 2],
        ['9007199254740992', 1],
      ],
    },
    {
      type: 'DECIMAL(38,2)',
      rows: '(1.02), (1.02), (1.01)',
      expected: [
        ['1.02', 2],
        ['1.01', 1],
      ],
    },
    {
      type: 'DOUBLE',
      rows: "('NaN'), ('NaN'), (1), ('Infinity'), ('-Infinity'), (NULL)",
      expected: [
        ['NaN', 2],
        ['-Infinity', 1],
        [1, 1],
        ['Infinity', 1],
      ],
    },
    { type: 'DOUBLE', rows: "('NaN')", expected: [['NaN', 1]] },
    { type: 'DOUBLE', rows: '(NULL)', expected: [] },
    { type: 'VARCHAR', rows: '', expected: [] },
  ])('preserves native values for $type with $rows', async ({ type, rows, expected }) => {
    await connection.run(`CREATE TABLE samples(entry ${type})`);
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics });
    expect(profileOutputSchema.parse(profile).models[0].columns[0].metrics).toEqual({
      value_counts: expected.map(([value, count]) => ({ value, count })),
      mode: expected[0]?.[0] ?? null,
      mode_count: expected[0]?.[1] ?? 0,
    });
  });

  it('shares the frequency histogram with singleton metrics', async () => {
    await connection.run('CREATE TABLE samples AS SELECT x % 100 AS n FROM range(50000) t(x)');
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const profile = await profileTables(connection, schema, { metrics: [...metrics, { id: 'unique_count' }] });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    expect(profile.models[0].columns[0].metrics).toMatchObject({ mode_count: 500, unique_count: 0 });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(1);
    expect(plan.match(/histogram\(#\d+\)/g)).toHaveLength(1);
  });

  it.each([
    { type: 'BOOLEAN', rows: '(TRUE), (TRUE), (TRUE), (FALSE), (NULL)', expected: 0.18872187554086717 },
    { type: 'VARCHAR', rows: "('A'), ('B'), ('C')", expected: 0 },
    { type: 'VARCHAR', rows: "('A'), ('A')", expected: 0 },
    { type: 'DOUBLE', rows: "(1), (1), (1), (2), ('NaN'), (NULL)", expected: 0.18872187554086717 },
    { type: 'DOUBLE', rows: '(NULL)', expected: 0 },
    { type: 'VARCHAR', rows: '', expected: 0 },
  ])('computes normalized class imbalance for $type with $rows', async ({ type, rows, expected }) => {
    await connection.run(`CREATE TABLE samples(value ${type})`);
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'imbalance' }],
    });
    expect(profile.models[0].columns[0].metrics.imbalance).toBeCloseTo(expected, 12);
  });
});
