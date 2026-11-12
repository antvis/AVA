import { expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

it('adds fixed-width slots and UTF-8 or binary payload bytes across columns', async () => {
  const db = await DuckDBInstance.create(':memory:');
  const connection = await db.connect();
  try {
    await connection.run('CREATE TABLE samples(n SMALLINT, label VARCHAR, bytes BLOB, amount DECIMAL(9,2))');
    await connection.run("INSERT INTO samples VALUES (NULL, '🦆', unhex('00ff'), 1.25), (3, 'é', NULL, NULL)");
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'memory_size' }, { id: 'record_size' }],
    });
    expect(profile.models[0].columns.map(({ metrics }) => metrics.memory_size)).toEqual([4, 6, 2, 8]);
    expect(profile.models[0].metrics).toEqual({ memory_size: 20, record_size: 10 });
  } finally {
    connection.closeSync();
    db.closeSync();
  }
});
