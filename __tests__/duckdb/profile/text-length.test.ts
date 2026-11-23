import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/text length', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const metrics = ['min_length', 'max_length', 'mean_length', 'median_length', 'length_histogram'].map((id) => ({
    id,
  }));

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(entry VARCHAR)');
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('weights each observed string and counts Unicode code points', async () => {
    await connection.run("INSERT INTO samples VALUES (''), ('é'), ('é'), ('👩‍👩‍👧‍👦'), ('👩‍👩‍👧‍👦'), ('👩‍👩‍👧‍👦'), (NULL)");
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics });
    expect(profile.models[0].columns[0].metrics).toEqual({
      min_length: 0,
      max_length: 7,
      mean_length: 4,
      median_length: 4.5,
      length_histogram: [
        { length: 0, count: 1 },
        { length: 1, count: 1 },
        { length: 2, count: 1 },
        { length: 7, count: 3 },
      ],
    });
  });

  it.each(['', '(NULL), (NULL)'])('returns empty statistics for %s', async (rows) => {
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics });
    expect(profile.models[0].columns[0].metrics).toEqual({
      min_length: null,
      max_length: null,
      mean_length: null,
      median_length: null,
      length_histogram: [],
    });
  });
});
