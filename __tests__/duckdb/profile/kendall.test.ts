import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/Kendall correlation', () => {
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

  it('matches pandas tau-b with ties, non-finite values and incomplete pairs', async () => {
    await connection.run('CREATE TABLE samples(a DOUBLE, b DOUBLE, c DOUBLE, k INTEGER)');
    await connection.run(`INSERT INTO samples VALUES
      (1,1,NULL,1), (2,2,10,1), (2,3,20,1), (4,100,NULL,1),
      (NULL,5,30,1), (5,NULL,40,1), ('Infinity',7,50,1)`);
    const result = await profileTables(connection, await getDuckDBSchema(connection), { metrics: [{ id: 'kendall' }] });
    const ab = expect.closeTo(0.91287092917528, 12);
    const ac = expect.closeTo(0.81649658092773, 12);
    expect(result.models[0].metrics.kendall).toEqual({
      columns: ['a', 'b', 'c', 'k'],
      matrix: [
        [1, ab, ac, null],
        [ab, 1, 1, null],
        [ac, 1, 1, null],
        [null, null, null, 1],
      ],
    });
  });

  it('weights repeated observation pairs without counting ties as concordant', async () => {
    await connection.run(`CREATE TABLE samples AS SELECT a,b FROM
      (VALUES (1,1,7), (1,2,3), (2,1,2), (2,2,5), (3,1,4), (3,3,2)) t(a,b,n), range(n)`);
    const result = await profileTables(connection, await getDuckDBSchema(connection), { metrics: [{ id: 'kendall' }] });
    const value = expect.closeTo(0.19562350795659428, 12);
    expect(result.models[0].metrics.kendall).toEqual({
      columns: ['a', 'b'],
      matrix: [
        [1, value],
        [value, 1],
      ],
    });
  });

  it('counts reverse rankings without a quadratic row join', async () => {
    await connection.run('CREATE TABLE samples AS SELECT x AS a, -x AS b FROM range(10000) t(x)');
    const result = await profileTables(connection, await getDuckDBSchema(connection), { metrics: [{ id: 'kendall' }] });
    expect(result.models[0].metrics.kendall).toEqual({
      columns: ['a', 'b'],
      matrix: [
        [1, -1],
        [-1, 1],
      ],
    });
  });
});
