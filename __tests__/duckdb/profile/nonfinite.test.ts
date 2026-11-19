import { expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

it('reproduces NumPy interpolation on either side of infinite observations', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const connection = await db.connect();
  try {
    await connection.run(`CREATE TABLE samples AS SELECT * FROM (VALUES
      ('-Infinity'::DOUBLE, 0::DOUBLE), (0, 1), (1, 2), (2, 'Infinity'), ('NaN', NULL)
    ) AS t(negative, positive)`);
    const metrics = [
      ...['min', 'max', 'mean', 'sum', 'range', 'stddev', 'median', 'mad'].map((id) => ({ id })),
      { id: 'quantiles', probabilities: [0, 0.1, 0.2, 0.5, 0.7, 1] },
    ];
    const { models } = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics,
      semantics: 'data-profiling',
    });
    expect(models[0].columns.map(({ metrics }) => metrics)).toEqual([
      {
        min: '-Infinity',
        max: 2,
        mean: '-Infinity',
        sum: '-Infinity',
        range: 'Infinity',
        stddev: null,
        median: 0.5,
        mad: 1,
        quantiles: [null, null, '-Infinity', 0.5, expect.closeTo(1.1, 12), 2].map((value, i) => ({
          probability: metrics[8].probabilities?.[i],
          value,
        })),
      },
      {
        min: 0,
        max: 'Infinity',
        mean: 'Infinity',
        sum: 'Infinity',
        range: 'Infinity',
        stddev: null,
        median: 1.5,
        mad: 1,
        quantiles: [0, expect.closeTo(0.3, 12), expect.closeTo(0.6, 12), 1.5, 'Infinity', null].map((value, i) => ({
          probability: metrics[8].probabilities?.[i],
          value,
        })),
      },
    ]);
  } finally {
    connection.closeSync();
    db.closeSync();
  }
});
