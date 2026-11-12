import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe("profile/Cramér's V", () => {
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

  it.each([
    ["('a','x',8), ('a','y',2), ('b','x',1), ('b','y',9)", 0.5729597091269405],
    ["('a','x',7), ('a','z',1), ('b','x',1), ('b','y',5), ('c','y',2), ('c','z',6)", 0.7143385788708027],
    ["('a','x',8), ('b','y',8)", 0.8653807997473879],
  ])('matches the reference corrected statistic for %s', async (rows, expected) => {
    await connection.run(`CREATE TABLE samples AS SELECT a,b FROM (VALUES ${rows}) t(a,b,n), range(n)`);
    await connection.run("INSERT INTO samples VALUES (NULL,'x'), ('a',NULL)");
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'cramers' }],
    });
    const coefficient = expect.closeTo(expected, 12);
    expect(profile.models[0].metrics.cramers).toEqual({
      columns: ['a', 'b'],
      matrix: [
        [1, coefficient],
        [coefficient, 1],
      ],
    });
  });

  it('filters constant and high-cardinality columns and supports numeric category codes', async () => {
    await connection.run(`CREATE TABLE samples AS SELECT x % 2 = 0 AS a, (x % 2)::DOUBLE AS b,
      x::VARCHAR AS id, 'constant' AS fixed FROM range(20) t(x)`);
    await connection.run("INSERT INTO samples VALUES (true, 'NaN', 'extra', 'constant')");
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'cramers', columns: ['a', 'b', 'id', 'fixed'], maxCategories: 2 }],
    });
    expect(profile.models[0].metrics.cramers).toMatchObject({ columns: ['a', 'b'] });
    const capped = await profileTables(connection, schema, { metrics: [{ id: 'cramers', maxCategories: 2 }] });
    expect(capped.models[0].metrics.cramers).toBeNull();
  });

  it('handles a missing pair even when both columns have multiple categories', async () => {
    await connection.run(
      "CREATE TABLE samples AS SELECT a,b FROM (VALUES ('a',NULL), ('b',NULL), (NULL,'x'), (NULL,'y')) t(a,b)"
    );
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'cramers' }],
    });
    expect(profile.models[0].metrics.cramers).toEqual({
      columns: ['a', 'b'],
      matrix: [
        [1, null],
        [null, 1],
      ],
    });
  });
});
