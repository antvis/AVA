import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';
import { assessQuality } from '../../../src/util/quality';

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

  it('can include NaN in missing values without losing the NaN count', async () => {
    await connection.run('CREATE TABLE floats(value DOUBLE)');
    await connection.run("INSERT INTO floats VALUES ('NaN'), (1), (2), (NULL)");
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, {
      semantics: 'data-profiling',
      metrics: [
        ...metrics,
        'nan_count',
        'null_count',
        'value_counts',
        'table_summary',
        'row_duplicates',
        'row_sample',
      ].map((id) => ({ id })),
    });
    expect(profileOutputSchema.parse(profile).semantics).toBe('data-profiling');
    const floats = profile.models.find(({ name }) => name === 'floats');
    expect(floats?.columns[0].metrics).toMatchObject({
      valid_count: 2,
      null_ratio: 0.5,
      unique_count: 2,
      unique_ratio: 1,
      nan_count: 1,
      value_counts: [
        { value: 1, count: 1 },
        { value: 2, count: 1 },
      ],
    });
    expect(floats?.metrics).toMatchObject({
      table_summary: { null_cell_count: 2 },
      row_duplicates: { group_count: 1, samples: [{ row_values: { value: null }, count: 2 }] },
      row_sample: {
        head: [
          { index: 0, row_values: { value: null } },
          { index: 1, row_values: { value: 1 } },
          { index: 2, row_values: { value: 2 } },
          { index: 3, row_values: { value: null } },
        ],
      },
    });
    const quality = assessQuality(profile, { rules: ['missing'] });
    expect(quality.models.find(({ name }) => name === 'floats')?.alerts[0].value).toBe(0.5);
  });
});
