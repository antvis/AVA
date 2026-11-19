import { expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { renderProfileHtml } from '../../../src/util/profile-report';

it('orders time-series points and keeps the extrema from every display bucket', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const connection = await db.connect();
  try {
    await connection.run('CREATE TABLE samples(x INTEGER, y DOUBLE)');
    await connection.run('INSERT INTO samples VALUES (9,3),(2,NULL),(1,4),(7,2),(0,1),(4,4),(8,8),(6,7),(5,10),(3,-2)');
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'time_series', orderBy: 'x', limit: 6 }],
    });
    expect(profile.models[0].columns[1].metrics.time_series).toEqual({
      count: 10,
      date_index: false,
      points: [
        { x: 0, y: 1 },
        { x: 1, y: 4 },
        { x: 3, y: -2 },
        { x: 5, y: 10 },
        { x: 7, y: 2 },
        { x: 8, y: 8 },
      ],
    });
    expect(renderProfileHtml(profile)).toContain('<figcaption>Time series</figcaption>');
  } finally {
    connection.closeSync();
    db.closeSync();
  }
});
