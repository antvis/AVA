import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/numeric value counts', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const kinds = ['zero', 'negative', 'infinite', 'nan', 'finite'];
  const metrics = kinds.flatMap((kind) => [{ id: `${kind}_count` }, { id: `${kind}_ratio` }]);

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it('reports excluded numeric observations without losing their counts', async () => {
    await connection.run(`CREATE TABLE samples AS SELECT x::DOUBLE AS n FROM
      (VALUES (NULL), ('NaN'), ('Infinity'), ('-Infinity'), ('-2'), ('0'), ('2')) t(x)`);
    const profile = await profileTables(connection, await getDuckDBSchema(connection), { metrics });
    const counts = [1, 2, 2, 1, 3];
    expect(profile.models[0].columns[0].metrics).toEqual(
      Object.fromEntries(
        kinds.flatMap((kind, i) => [
          [`${kind}_count`, counts[i]],
          [`${kind}_ratio`, counts[i] / 7],
        ])
      )
    );
  });

  it.each(['DOUBLE', 'DECIMAL(38,10)', 'HUGEINT', 'UBIGINT'])(
    'counts empty, all-null and zero values without narrowing %s',
    async (type) => {
      await connection.run(`CREATE TABLE samples(n ${type})`);
      const schema = await getDuckDBSchema(connection);
      for (const rows of ['', '(NULL)', '(0)']) {
        if (rows) await connection.run(`INSERT INTO samples VALUES ${rows}`);
        const profile = await profileTables(connection, schema, { metrics });
        const present = rows === '(0)' ? 1 : 0;
        expect(profile.models[0].columns[0].metrics).toEqual(
          Object.fromEntries(
            kinds.flatMap((kind) => {
              const count = kind === 'zero' || kind === 'finite' ? present : 0;
              return [
                [`${kind}_count`, count],
                [`${kind}_ratio`, count / (rows === '(0)' ? 2 : 1)],
              ];
            })
          )
        );
      }
    }
  );
});
