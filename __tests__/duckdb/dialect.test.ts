import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { DuckDBQueryDialect } from '../../src/query/duckdb';
import { getLLMConfig } from '../test-utils';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('DuckDB 2.0 query validation', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;
  const dialect = new DuckDBQueryDialect(getLLMConfig());

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE target(id INTEGER); INSERT INTO target VALUES (1)');
  });

  afterEach(() => {
    connection?.closeSync();
    db?.closeSync();
  });

  it.each([
    'INSERT INTO target VALUES (2) RETURNING *',
    'UPDATE target SET id = 2 RETURNING *',
    'DELETE FROM target RETURNING *',
    "COPY target TO '/tmp/ava-duckdb-blocked.csv'",
  ])('rejects a data-modifying CTE: %s', async (body) => {
    await expect(dialect.validateDSL(`WITH changed AS (${body}) SELECT * FROM changed`, connection)).rejects.toThrow(
      'only read-only SELECT statements'
    );
    expect((await connection.runAndReadAll('SELECT * FROM target')).getRowObjectsJson()).toEqual([{ id: 1 }]);
  });

  it('rejects writes nested inside a subquery', async () => {
    await expect(
      dialect.validateDSL(
        `
      SELECT * FROM (WITH changed AS (DELETE FROM target RETURNING *) SELECT * FROM changed)
    `,
        connection
      )
    ).rejects.toThrow('data-modifying statement must be at the top level');
  });

  it.each([
    'WITH selected AS (SELECT * FROM target) SELECT * FROM selected',
    'SELECT list_transform([1, 2, 3], lambda x: x + 1) AS values',
    "SELECT 'DELETE FROM target' AS text, 'INSERT_QUERY_NODE' AS type",
    "SELECT json_extract('{\"a\":1}', '$.a') AS value",
  ])('accepts read-only DuckDB syntax: %s', async (sql) => {
    await expect(dialect.validateDSL(sql, connection)).resolves.toBe(sql);
  });
});
