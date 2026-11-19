import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/distribution shape', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const metrics = [{ id: 'skewness' }, { id: 'kurtosis' }];

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  // Expected values from pandas Series.skew() and Series.kurt(), used by fg-data-profiling.
  it.each([
    [0, 1.5491313812566696, 2.6750983101286003],
    [1e8, 1.5491313860411444, 2.6750983279168743],
    [1e12, 1.549052991712311, 2.6748068679096395],
  ])('matches pandas when numeric values are shifted by %s', async (shift, skewness, kurtosis) => {
    await connection.run(
      `CREATE TABLE samples AS SELECT x::DOUBLE + ${shift} AS n FROM (VALUES (1),(2),(3),(4),(9)) t(x)`
    );
    await connection.run("INSERT INTO samples VALUES (NULL), ('NaN'), ('Infinity'), ('-Infinity')");
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics });
    expect(profile.models[0].columns[0].metrics).toEqual({
      skewness: expect.closeTo(skewness, 10),
      kurtosis: expect.closeTo(kurtosis, 10),
    });
  });

  it.each([
    ['', null, null],
    ['(NULL)', null, null],
    ['(1),(2)', null, null],
    ['(2),(2),(2)', 0, null],
    ['(2),(2),(2),(2)', 0, 0],
    ['(0),(0),(0),(0.000001)', 0, 0],
  ])('handles short or nearly constant samples %s', async (rows, skewness, kurtosis) => {
    await connection.run('CREATE TABLE samples(n DOUBLE)');
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics });
    expect(profile.models[0].columns[0].metrics).toEqual({ skewness, kurtosis });
  });

  it('shares two scans across numeric columns and retains other metrics', async () => {
    await connection.run(
      `CREATE TABLE __ava_centers AS SELECT ${Array.from({ length: 12 }, (_, i) => `x + ${i} AS center${i}`).join(
        ', '
      )} FROM range(10000) t(x)`
    );
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'row_count' }, { id: 'mean' }, ...metrics],
    });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    expect(profile.models[0].metrics.row_count).toBe(10000);
    expect(profile.models[0].columns[11].metrics).toMatchObject({ mean: 5010.5, skewness: 0 });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(2);
  });
});
