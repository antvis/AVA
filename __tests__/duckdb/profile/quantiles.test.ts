import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/quantiles', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(n DOUBLE)');
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('matches pandas linear interpolation and excludes non-finite values', async () => {
    await connection.run(
      "INSERT INTO samples VALUES (1), (2), (3), (4), (9), (NULL), ('NaN'), ('Infinity'), ('-Infinity')"
    );
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'quantiles' }],
    });
    expect(profile.models[0].columns[0].metrics.quantiles).toEqual([
      { probability: 0.05, value: expect.closeTo(1.2, 12) },
      { probability: 0.25, value: 2 },
      { probability: 0.5, value: 3 },
      { probability: 0.75, value: 4 },
      { probability: 0.95, value: expect.closeTo(8, 12) },
    ]);
  });

  it.each(['', '(NULL)', "('NaN'), ('Infinity')", '(7)'])(
    'preserves requested order and duplicate probabilities for %s',
    async (rows) => {
      if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
      const probabilities = [1, 0, 0.5, 0.5];
      const profile = await profileTables(connection, await getDuckDBSchema(connection), {
        metrics: [{ id: 'quantiles', probabilities }],
      });
      expect(profile.models[0].columns[0].metrics.quantiles).toEqual(
        probabilities.map((probability) => ({ probability, value: rows === '(7)' ? 7 : null }))
      );
    }
  );

  it.each([[], [-0.1], [1.1], [NaN], [Infinity], ['0.5'], '0.5', null])(
    'rejects invalid probabilities %j',
    async (probabilities) => {
      await expect(
        profileTables(connection, await getDuckDBSchema(connection), {
          metrics: [{ id: 'quantiles', probabilities }],
        })
      ).rejects.toThrow();
    }
  );
});
