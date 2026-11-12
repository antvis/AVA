import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/row samples', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(id INTEGER, label VARCHAR, tags INTEGER[])');
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('keeps source order and bounds rows and columns before returning a sample', async () => {
    await connection.run(`INSERT INTO samples VALUES
      (9,'B',[1]), (2,NULL,NULL), (8,'A',[2]), (1,'C',[]), (7,'A',[2])`);
    const schema = await getDuckDBSchema(connection);
    const metrics = [{ id: 'row_sample', columns: ['id', 'tags'], head: 2, tail: 2, random: 2, seed: 7 }];
    const profile = () => profileTables(connection, schema, { metrics });
    const result = (await profile()).models[0].metrics.row_sample as { random: { index: number }[] };
    expect(result).toMatchObject({
      head: [
        { index: 0, row_values: { id: 9, tags: [1] } },
        { index: 1, row_values: { id: 2, tags: null } },
      ],
      tail: [
        { index: 3, row_values: { id: 1, tags: [] } },
        { index: 4, row_values: { id: 7, tags: [2] } },
      ],
    });
    expect(new Set(result.random.map(({ index }) => index)).size).toBe(2);
    expect((await profile()).models[0].metrics.row_sample).toEqual(result);
  });

  it('handles an empty table and rejects impossible random samples', async () => {
    const schema = await getDuckDBSchema(connection);
    const profile = () => profileTables(connection, schema, { metrics: [{ id: 'row_sample', random: 5 }] });
    expect((await profile()).models[0].metrics.row_sample).toEqual({ head: [], tail: [], random: [] });
    await connection.run('INSERT INTO samples VALUES (1,NULL,NULL)');
    await expect(profile()).rejects.toThrow('Cannot sample more rows than the source');
    const disabled = await profileTables(connection, schema, {
      metrics: [{ id: 'row_sample', head: 0, tail: 0, random: 0 }],
    });
    expect(disabled.models[0].metrics.row_sample).toEqual({ head: [], tail: [], random: [] });
  });
});
