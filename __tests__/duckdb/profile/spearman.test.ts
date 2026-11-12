import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/Spearman correlation', () => {
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

  it('matches pandas with ties and different missing observations per pair', async () => {
    await connection.run('CREATE TABLE samples(a DOUBLE, b DOUBLE, c DOUBLE, k INTEGER, label VARCHAR)');
    await connection.run(`INSERT INTO samples VALUES
      (1,1,NULL,1,'A'), (2,2,10,1,'A'), (2,3,20,1,'A'), (4,100,NULL,1,'B'),
      (NULL,5,30,1,'B'), (5,NULL,40,1,'B'), ('Infinity',7,50,1,'B')`);
    const schema = await getDuckDBSchema(connection);
    const result = await profileTables(connection, schema, { metrics: [{ id: 'spearman' }] });
    const ab = expect.closeTo(0.94868329805051, 12);
    const ac = expect.closeTo(0.86602540378444, 12);
    const perfect = expect.closeTo(1, 12);
    expect(result.models[0].metrics.spearman).toEqual({
      columns: ['a', 'b', 'c', 'k'],
      matrix: [
        [1, ab, ac, null],
        [ab, 1, perfect, null],
        [ac, perfect, 1, null],
        [null, null, null, null],
      ],
    });
    const subset = await profileTables(connection, schema, { metrics: [{ id: 'spearman', columns: ['c', 'a'] }] });
    expect(subset.models[0].metrics.spearman).toEqual({
      columns: ['c', 'a'],
      matrix: [
        [1, ac],
        [ac, 1],
      ],
    });
  });

  it('keeps the result shape for empty input', async () => {
    await connection.run('CREATE TABLE samples(a DOUBLE, b DOUBLE)');
    const result = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'spearman' }],
    });
    expect(result.models[0].metrics.spearman).toEqual({
      columns: ['a', 'b'],
      matrix: [
        [null, null],
        [null, null],
      ],
    });
  });

  it('materializes selected columns once for all pairwise ranks', async () => {
    await connection.run(`CREATE TABLE __ava_rank_rows AS SELECT x % 100 AS a, -(x % 100) AS b,
      x % 100 AS c FROM range(50000) t(x)`);
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const result = await profileTables(connection, schema, { metrics: [{ id: 'spearman' }, { id: 'row_count' }] });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    const positive = expect.closeTo(1, 12);
    const negative = expect.closeTo(-1, 12);
    expect(result.models[0].metrics).toEqual({
      row_count: 50000,
      spearman: {
        columns: ['a', 'b', 'c'],
        matrix: [
          [1, negative, positive],
          [negative, 1, negative],
          [positive, negative, 1],
        ],
      },
    });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(2);
  });
});
