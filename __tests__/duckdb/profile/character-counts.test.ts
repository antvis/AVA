import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/character counts', () => {
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

  it('counts each code point and weights duplicate strings', async () => {
    await connection.run('INSERT INTO samples VALUES (?), (?), (?), (?), (?), (?), (NULL)', [
      'A A',
      'A A',
      'é',
      'e\u0301',
      '👩‍👧',
      '',
    ]);
    const result = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'character_counts' }],
    });
    expect(result.models[0].columns[0].metrics.character_counts).toEqual([
      { value: 'A', count: 4 },
      { value: ' ', count: 2 },
      { value: 'e', count: 1 },
      { value: 'é', count: 1 },
      { value: '\u0301', count: 1 },
      { value: '\u200d', count: 1 },
      { value: '👧', count: 1 },
      { value: '👩', count: 1 },
    ]);
  });

  it.each(['', "(NULL), ('')"])('returns an empty list for %s', async (rows) => {
    if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
    const result = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'character_counts' }],
    });
    expect(result.models[0].columns[0].metrics.character_counts).toEqual([]);
  });
});
