import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/row duplicates', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const empty = { group_count: 0, group_ratio: 0, duplicate_row_count: 0, excess_row_count: 0, samples: [] };

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples("row key" VARCHAR, tags INTEGER[], amount DOUBLE)');
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('distinguishes duplicate groups, rows and excess rows with nested values and nulls', async () => {
    await connection.run(`INSERT INTO samples VALUES
      ('B', NULL, 2), ('B', NULL, 2), ('A', NULL, 'NaN'), ('A', NULL, 'NaN'),
      ('C', [3], 4), ('C', [3], 4), ('C', [3], 4), ('C', [4], 4), (NULL, NULL, NULL)`);
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'row_duplicates', limit: 2 }, { id: 'skewness' }],
    });
    expect(profileOutputSchema.parse(profile).models[0].metrics.row_duplicates).toEqual({
      group_count: 3,
      group_ratio: 3 / 9,
      duplicate_row_count: 7,
      excess_row_count: 4,
      samples: [
        { row_values: { 'row key': 'C', tags: [3], amount: 4 }, count: 3 },
        { row_values: { 'row key': 'A', tags: null, amount: 'NaN' }, count: 2 },
      ],
    });
    const keyOnly = await profileTables(connection, schema, {
      metrics: [{ id: 'row_duplicates', columns: ['row key'], limit: 0 }],
    });
    expect(keyOnly.models[0].metrics.row_duplicates).toEqual({
      group_count: 3,
      group_ratio: 3 / 9,
      duplicate_row_count: 8,
      excess_row_count: 5,
      samples: [],
    });
  });

  it.each(['', "('A', NULL, 1), ('A', NULL, 2)"])('returns zero counts for %s', async (rows) => {
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'row_duplicates' }],
    });
    expect(profile.models[0].metrics.row_duplicates).toEqual(empty);
  });

  it('rejects unknown subset columns', async () => {
    await expect(
      profileTables(connection, await getDuckDBSchema(connection), {
        metrics: [{ id: 'row_duplicates', columns: ['missing'] }],
      })
    ).rejects.toThrow('Unknown row_duplicates column: missing');
  });
});
