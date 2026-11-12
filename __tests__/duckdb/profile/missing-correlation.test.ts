import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/missingness correlation', () => {
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

  it('correlates SQL NULL and NaN masks and drops constant masks', async () => {
    await connection.run('CREATE TABLE samples(a DOUBLE, b VARCHAR, always_missing DATE, complete DOUBLE)');
    await connection.run(`INSERT INTO samples VALUES
      (1,NULL,NULL,'Infinity'), (NULL,'A',NULL,1), ('NaN','B',NULL,1), (1,NULL,NULL,1)`);
    const schema = await getDuckDBSchema(connection);
    const result = await profileTables(connection, schema, {
      metrics: [{ id: 'missing_correlation' }, { id: 'missing_matrix', columns: ['b', 'a'], limit: 2 }],
    });
    const negative = expect.closeTo(-1, 12);
    expect(result.models[0].metrics.missing_correlation).toEqual({
      columns: ['a', 'b'],
      matrix: [
        [1, negative],
        [negative, 1],
      ],
    });
    expect(result.models[0].metrics.missing_matrix).toEqual({ columns: ['b', 'a'], row_count: 4, rows: ['10', '01'] });
    const single = await profileTables(connection, schema, {
      metrics: [{ id: 'missing_correlation', columns: ['a', 'complete'] }],
    });
    expect(single.models[0].metrics.missing_correlation).toBeNull();
  });

  it('computes the matrix and other aggregates with a single scan', async () => {
    await connection.run(`CREATE TABLE samples AS SELECT CASE WHEN x % 3 = 0 THEN NULL ELSE x END AS a,
      CASE WHEN x % 2 = 0 THEN NULL ELSE x END AS b FROM range(50000) t(x)`);
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const result = await profileTables(connection, schema, {
      metrics: [{ id: 'missing_correlation' }, { id: 'row_count' }],
    });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    expect(result.models[0].metrics.row_count).toBe(50000);
    expect(result.models[0].metrics.missing_correlation).toMatchObject({ columns: ['a', 'b'] });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(1);
  });
});
