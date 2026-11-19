import { expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

it('matches SciPy on sparse continuous bins and categorical frequencies', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const connection = await db.connect();
  try {
    await connection.run('CREATE TABLE observations(number DOUBLE, category VARCHAR, constant INTEGER)');
    const schema = await getDuckDBSchema(connection);
    const profile = async () => {
      const { models } = await profileTables(connection, schema, { metrics: [{ id: 'chi_squared' }] });
      return models[0].columns.map(({ metrics }) => metrics.chi_squared);
    };
    expect(await profile()).toEqual(Array(3).fill({ statistic: 0, pvalue: 0 }));
    await connection.run(`INSERT INTO observations VALUES (1,'a',0), (1,'a',0), (1,'a',0), (2,'b',0),
      (3,'b',0), (8,'c',0), (NULL,NULL,0), ('Infinity',NULL,0), ('NaN',NULL,0)`);
    expect(await profile()).toEqual([
      { statistic: expect.closeTo(6, 12), pvalue: expect.closeTo(0.11161022509471245, 12) },
      { statistic: expect.closeTo(1, 12), pvalue: expect.closeTo(0.6065306597126334, 12) },
      { statistic: 0, pvalue: null },
    ]);
  } finally {
    connection.closeSync();
    db.closeSync();
  }
});
