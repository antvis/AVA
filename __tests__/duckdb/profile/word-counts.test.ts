import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/word counts', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(text VARCHAR)');
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('matches reference token weights and Unicode full casing', async () => {
    await connection.run(`INSERT INTO samples VALUES
      ('ÉCHO café'), ('ΟΣ İ'), ('ALPHA, Alpha!'), ('café... alpha'), ('---'), ('a\u00a0b'), ('ΟΣ İ'), (NULL), ('alpha,beta')`);
    const schema = await getDuckDBSchema(connection);
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'word_counts', stopWords: ['éCHO', 'A'] }],
    });
    expect(profile.models[0].columns[0].metrics.word_counts).toEqual([
      { value: 'alpha', count: 3 },
      { value: 'café', count: 2 },
      { value: 'i\u0307', count: 2 },
      { value: 'ος', count: 2 },
      { value: '', count: 1 },
      { value: 'alpha,beta', count: 1 },
      { value: 'b', count: 1 },
    ]);
    const top = await profileTables(connection, schema, { metrics: [{ id: 'word_counts', limit: 2 }] });
    expect(top.models[0].columns[0].metrics.word_counts).toEqual([
      { value: 'alpha', count: 3 },
      { value: 'café', count: 2 },
    ]);
  });

  it.each(['', "(NULL), (''), ('   ')"])('returns an empty list when there are no tokens: %s', async (rows) => {
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'word_counts' }],
    });
    expect(profile.models[0].columns[0].metrics.word_counts).toEqual([]);
  });
});
