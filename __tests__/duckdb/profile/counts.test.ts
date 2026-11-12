import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/column counts', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const metrics = ['valid_count', 'null_ratio', 'distinct_ratio', 'unique_count', 'unique_ratio', 'is_unique'];

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(value VARCHAR)');
  });

  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it.each([
    { rows: "('A'), ('A'), ('B'), ('C'), (NULL)", expected: [4, 0.2, 0.75, 2, 0.5, false] },
    { rows: "('A'), (NULL)", expected: [1, 0.5, 1, 1, 1, true] },
    { rows: '(NULL), (NULL)', expected: [0, 1, 0, 0, 0, false] },
    { rows: '', expected: [0, 0, 0, 0, 0, false] },
  ])('distinguishes distinct and singleton values in $rows', async ({ rows, expected }) => {
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: metrics.map((id) => ({ id })),
    });
    expect(profile.models[0].columns[0].metrics).toEqual(Object.fromEntries(metrics.map((id, i) => [id, expected[i]])));
    expect(profileOutputSchema.parse(profile)).toEqual(profile);
  });

  it('returns a count when unique_count is the only metric on an empty table', async () => {
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'unique_count' }],
    });
    expect(profile.models[0].columns[0].metrics).toEqual({ unique_count: 0 });
  });

  it('counts NaN separately from other numeric values and SQL NULL', async () => {
    await connection.run('CREATE TABLE floats(value DOUBLE)');
    await connection.run("INSERT INTO floats VALUES ('NaN'), (1), (1), (2), ('Infinity'), ('-Infinity'), (NULL)");
    const schema = await getDuckDBSchema(connection);
    const profile = () => profileTables(connection, schema, { metrics: metrics.map((id) => ({ id })) });
    const first = (await profile()).models.find((model) => model.name === 'floats');
    expect(first?.columns[0].metrics).toMatchObject({ valid_count: 6, unique_count: 4, unique_ratio: 4 / 6 });
    await connection.run("INSERT INTO floats VALUES ('NaN')");
    const repeated = (await profile()).models.find((model) => model.name === 'floats');
    expect(repeated?.columns[0].metrics).toMatchObject({ valid_count: 7, unique_count: 3, unique_ratio: 3 / 7 });
  });

  it('shares one histogram and one table scan for exact counts on high-cardinality input', async () => {
    await connection.run('INSERT INTO samples SELECT i::VARCHAR FROM range(50000) t(i)');
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const profile = await profileTables(connection, schema, { metrics: metrics.map((id) => ({ id })) });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    expect(profile.models[0].columns[0].metrics).toMatchObject({
      unique_count: 50000,
      unique_ratio: 1,
      is_unique: true,
    });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(1);
    expect(plan.match(/histogram\(#\d+\)/g)).toHaveLength(1);
  });
});
