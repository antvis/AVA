import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/Pearson correlation', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('matches pandas pairwise complete observations, including constant columns', async () => {
    await connection.run('CREATE TABLE samples(a DOUBLE, b DOUBLE, c DOUBLE, k INTEGER, label VARCHAR)');
    await connection.run(`INSERT INTO samples VALUES
      (1,1,NULL,1,'A'), (2,2,10,1,'A'), (3,3,20,1,'A'), (4,100,NULL,1,'B'),
      (NULL,5,30,1,'B'), ('NaN',6,40,1,'B'), ('Infinity',7,50,1,'B')`);
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, { metrics: [{ id: 'pearson' }] });
    const ab = expect.closeTo(0.78502642096301, 12);
    const bc = expect.closeTo(0.99124070716193, 12);
    expect(profileOutputSchema.parse(profile).models[0].metrics.pearson).toEqual({
      columns: ['a', 'b', 'c', 'k'],
      matrix: [
        [1, ab, 1, null],
        [ab, 1, bc, null],
        [1, bc, 1, null],
        [null, null, null, null],
      ],
    });
    const subset = await profileTables(connection, schema, { metrics: [{ id: 'pearson', columns: ['c', 'a'] }] });
    expect(subset.models[0].metrics.pearson).toEqual({
      columns: ['c', 'a'],
      matrix: [
        [1, 1],
        [1, 1],
      ],
    });
    await expect(
      profileTables(connection, schema, { metrics: [{ id: 'pearson', columns: ['label'] }] })
    ).rejects.toThrow('Pearson correlation requires numeric columns');
  });

  it('returns a well-shaped matrix for empty and non-numeric tables', async () => {
    await connection.run('CREATE TABLE samples(n DOUBLE)');
    await connection.run('CREATE TABLE labels(name VARCHAR)');
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'pearson' }],
    });
    expect(profile.models.find(({ name }) => name === 'samples')?.metrics.pearson).toEqual({
      columns: ['n'],
      matrix: [[null]],
    });
    expect(profile.models.find(({ name }) => name === 'labels')?.metrics.pearson).toEqual({ columns: [], matrix: [] });
  });

  it('computes a column subset and other statistics in a single scan', async () => {
    await connection.run(
      'CREATE TABLE samples AS SELECT 1e12 + x AS a, 1e12 - x AS b, x % 3 AS c FROM range(50000) t(x)'
    );
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'pearson', columns: ['b', 'a'] }, { id: 'row_count' }],
    });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    expect(profile.models[0].metrics).toEqual({
      row_count: 50000,
      pearson: {
        columns: ['b', 'a'],
        matrix: [
          [1, -1],
          [-1, 1],
        ],
      },
    });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(1);
  });
});
