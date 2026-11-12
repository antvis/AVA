import { expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

it('compares ordered numeric values across missing observations without rounding integers', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const connection = await db.connect();
  try {
    await connection.run(
      `CREATE TABLE sequence(rising DOUBLE, falling BIGINT, tied INTEGER, "__AVA_PREVIOUS0" VARCHAR)`
    );
    await connection.run(`INSERT INTO sequence VALUES
      ('-Infinity', 9007199254740994, 1, NULL), (NULL, NULL, 1, NULL),
      ('NaN', 9007199254740993, 2, NULL), (2, 9007199254740992, 2, NULL), ('Infinity', NULL, 3, NULL)`);
    const schema = await getDuckDBSchema(connection);
    const metrics = [{ id: 'monotonicity' }, { id: 'histogram' }];
    const { models } = await profileTables(connection, schema, { metrics });
    expect(models[0].columns.map(({ metrics }) => metrics.monotonicity)).toEqual([
      { increasing: true, decreasing: false, strictly_increasing: true, strictly_decreasing: false, direction: 2 },
      { increasing: false, decreasing: true, strictly_increasing: false, strictly_decreasing: true, direction: -2 },
      { increasing: true, decreasing: false, strictly_increasing: false, strictly_decreasing: false, direction: 1 },
      undefined,
    ]);
  } finally {
    connection.closeSync();
    db.closeSync();
  }
});
