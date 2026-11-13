import { expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

it('plots pairwise finite values and preserves counts when it bins them', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const connection = await db.connect();
  try {
    await connection.run('CREATE TABLE samples(a DOUBLE, b DOUBLE)');
    await connection.run(
      "INSERT INTO samples VALUES (2,3), (1,2), (1,2), (3,NULL), (NULL,3), ('NaN',4), (5,'Infinity')"
    );
    const schema = await getDuckDBSchema(connection);
    const points = await profileTables(connection, schema, { metrics: [{ id: 'scatter_pairs', targets: ['a'] }] });
    const pairs = points.models[0].metrics.scatter_pairs as { points: unknown[] }[];
    expect(pairs).toHaveLength(2);
    expect(pairs[1]).toMatchObject({
      x_column: 'a',
      y_column: 'b',
      count: 3,
      x_min: 1,
      x_max: 2,
      y_min: 2,
      y_max: 3,
      points: [
        { x: 2, y: 3 },
        { x: 1, y: 2 },
        { x: 1, y: 2 },
      ],
      hexagons: [],
    });
    const binned = await profileTables(connection, schema, {
      metrics: [{ id: 'scatter_pairs', targets: ['a'], threshold: 2 }],
    });
    const bins = binned.models[0].metrics.scatter_pairs as { points: unknown[]; hexagons: { count: number }[] }[];
    expect(bins[1].points).toEqual([]);
    expect(bins[1].hexagons.map(({ count }) => count).sort()).toEqual([1, 2]);
  } finally {
    connection.closeSync();
    db.closeSync();
  }
});
