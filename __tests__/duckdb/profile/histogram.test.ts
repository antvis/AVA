import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/histogram', () => {
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

  it('matches reference bucket boundaries and keeps empty bins', async () => {
    await connection.run('CREATE TABLE samples(n DOUBLE)');
    await connection.run(`INSERT INTO samples VALUES (-3), (0), (1), (3), (4), (9), (9),
      (NULL), ('NaN'), ('Infinity'), ('-Infinity')`);
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, { metrics: [{ id: 'histogram', bins: 4 }] });
    expect(profileOutputSchema.parse(profile).models[0].columns[0].metrics.histogram).toEqual({
      bin_edges: [-3, 0, 3, 6, 9],
      counts: [1, 2, 2, 2],
    });
    const density = await profileTables(connection, schema, { metrics: [{ id: 'histogram', bins: 4, density: true }] });
    expect(density.models[0].columns[0].metrics.histogram).toEqual({
      bin_edges: [-3, 0, 3, 6, 9],
      counts: [1 / 21, 2 / 21, 2 / 21, 2 / 21],
    });
    await connection.run('DELETE FROM samples WHERE n > -3 AND n < 9');
    const sparse = await profileTables(connection, schema, { metrics: [{ id: 'histogram', bins: 4 }] });
    expect(sparse.models[0].columns[0].metrics.histogram).toEqual({
      bin_edges: [-3, 0, 3, 6, 9],
      counts: [1, 0, 0, 2],
    });
  });

  it.each([
    ['', [], []],
    ["(NULL), ('NaN'), ('Infinity'), ('-Infinity')", [], []],
    ['(0), (0)', [-0.5, 0.5], [2]],
    ['(5), (5)', [4.5, 5.5], [2]],
    ['(5e-324), (5e-324)', [0, 1e-323], [2]],
    ['(-1.7e308), (1.7e308)', [-1.7e308, 0, 1.7e308], [1, 1]],
  ])('handles constant, empty and extreme ranges %s', async (rows, bin_edges, counts) => {
    await connection.run('CREATE TABLE samples(n DOUBLE)');
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'histogram' }],
    });
    expect(profileOutputSchema.parse(profile).models[0].columns[0].metrics.histogram).toEqual({ bin_edges, counts });
  });

  it('selects automatic bins from distinct values and honors the maximum', async () => {
    await connection.run(
      'CREATE TABLE samples AS SELECT x::DOUBLE AS n FROM (VALUES (0), (1), (2), (3), (4), (9), (9), (9), (9)) t(x)'
    );
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, { metrics: [{ id: 'histogram', bins: 0 }] });
    expect(profile.models[0].columns[0].metrics.histogram).toEqual({
      bin_edges: [0, 2.25, 4.5, 6.75, 9],
      counts: [3, 2, 0, 4],
    });
    const capped = await profileTables(connection, schema, { metrics: [{ id: 'histogram', bins: 0, maxBins: 2 }] });
    expect(capped.models[0].columns[0].metrics.histogram).toEqual({ bin_edges: [0, 4.5, 9], counts: [5, 4] });
  });

  it('uses epoch milliseconds for dates and ignores infinite dates', async () => {
    await connection.run(
      "CREATE TABLE samples AS SELECT x::DATE AS day FROM (VALUES ('1970-01-01'), ('1970-01-02'), ('1970-01-03'), ('infinity')) t(x)"
    );
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'histogram', bins: 2 }],
    });
    expect(profile.models[0].columns[0].metrics.histogram).toEqual({
      bin_edges: [0, 86400000, 172800000],
      counts: [1, 2],
    });
  });

  it('handles representationally identical edges without losing counts', async () => {
    await connection.run('CREATE TABLE samples(n DOUBLE)');
    await connection.run('INSERT INTO samples VALUES (0), (5e-324), (1e-323)');
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'histogram' }],
    });
    expect(profile.models[0].columns[0].metrics.histogram).toEqual({
      bin_edges: [0, 5e-324, 1e-323],
      counts: [1, 2],
    });
  });

  it('shares two scans with shape metrics across a wide table', async () => {
    await connection.run(
      `CREATE TABLE samples AS SELECT ${Array.from({ length: 8 }, (_, i) => `x + ${i} AS c${i}`).join(
        ', '
      )} FROM range(50000) t(x)`
    );
    const schema = await getDuckDBSchema(connection);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const profile = await profileTables(connection, schema, { metrics: [{ id: 'histogram' }, { id: 'skewness' }] });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    const histogram = profile.models[0].columns[0].metrics.histogram as { counts: number[] };
    expect(histogram.counts).toEqual(Array(50).fill(1000));
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(2);
  });
});
