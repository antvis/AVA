import { describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { loadMySQL } from '../../../src/duckdb/loaders/mysql';
import { loadPostgreSQL } from '../../../src/duckdb/loaders/postgresql';

describe.each([
  {
    type: 'mysql',
    enabled: process.env.AVA_MYSQL_TEST === '1',
    load: loadMySQL,
    port: Number(process.env.AVA_MYSQL_TEST_PORT ?? 13306),
    database: 'ava_mysql_test',
  },
  {
    type: 'postgresql',
    enabled: process.env.AVA_POSTGRESQL_TEST === '1',
    load: loadPostgreSQL,
    port: Number(process.env.AVA_POSTGRESQL_TEST_PORT ?? 15432),
    database: 'ava_postgresql_test',
  },
])('loaders/$type pushdown', ({ type, enabled, load, port, database }) => {
  it.skipIf(!enabled)(
    'uses native remote query optimization',
    async () => {
      const instance = await DuckDBInstance.create(':memory:');
      const conn = await instance.connect();
      const source = await load({ host: '127.0.0.1', port, database, user: 'ava_test', password: 'ava_test_password' });
      try {
        await source.register(conn);
        const sql =
          type === 'mysql'
            ? `SELECT c.name, SUM(o.amount) AS total FROM orders o
           JOIN customers c USING (tenant_id, customer_id) GROUP BY c.name ORDER BY c.name`
            : 'SELECT amount FROM orders WHERE amount > 20';
        const reader = await conn.runAndReadAll(`EXPLAIN ${sql}`);
        const plan = reader
          .getRowObjectsJson()
          .map((row) => row.explain_value)
          .join('\n');
        if (type === 'mysql') {
          expect(plan).toMatch(/Mysql Query|MYSQL_QUERY/i);
          expect(plan).not.toMatch(/Mysql Scan|MYSQL_SCAN|HASH_JOIN|Hash Join|GROUP_BY|Group By/i);
        } else {
          expect(plan).toMatch(/Postgres Scan|POSTGRES_SCAN/i);
          expect(plan).toContain('amount');
          expect(plan).toContain('Filters:');
          expect(plan).not.toContain('customer_id');
        }
      } finally {
        conn.closeSync();
        instance.closeSync();
        await source.cleanup();
      }
    },
    30000
  );
});
