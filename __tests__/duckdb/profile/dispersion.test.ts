import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/dispersion', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const ids = ['variance', 'mad', 'iqr', 'cv', 'range'];

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
      rows: '(1), (2), (3), (4), (9)',
      values: [expect.closeTo(9.7, 12), 1, 2, expect.closeTo(Math.sqrt(9.7) / 3.8, 12), 8],
    },
    { rows: '', values: [null, null, null, null, null] },
    { rows: "(NULL), ('NaN'), ('Infinity'), ('-Infinity')", values: [null, null, null, null, null] },
    { rows: '(7)', values: [null, 0, 0, null, 0] },
    { rows: '(2), (2), (2)', values: [0, 0, 0, 0, 0] },
    { rows: '(-1), (1)', values: [2, 1, 1, null, 2] },
  ])('computes dispersion for $rows', async ({ rows, values }) => {
    await connection.run('CREATE TABLE samples(n DOUBLE)');
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: ids.map((id) => ({ id })),
    });
    expect(profile.models[0].columns[0].metrics).toEqual(Object.fromEntries(ids.map((id, i) => [id, values[i]])));
  });

  it.each([
    { type: 'BIGINT', rows: '(9007199254740992), (9007199254740993)', expected: 1 },
    { type: 'BIGINT', rows: '(-9223372036854775808), (9223372036854775807)', expected: 18446744073709551616 },
    { type: 'DECIMAL(38,2)', rows: '(9007199254740992.01), (9007199254740992.02)', expected: 0.01 },
    { type: 'DATE', rows: "('2024-01-01'), ('2024-01-03')", expected: 2 * 86400000 },
  ])('retains range precision and handles overflow for $type', async ({ type, rows, expected }) => {
    await connection.run(`CREATE TABLE samples(n ${type})`);
    await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics: [{ id: 'range' }] });
    expect(profile.models[0].columns[0].metrics.range).toBe(expected);
  });
});
