import { describe, expect, it, vi } from 'vitest';

import { loadMySQL } from '../../../src/duckdb/loaders/mysql';
import { loadPostgreSQL } from '../../../src/duckdb/loaders/postgresql';

import type { DuckDBConnection } from '@duckdb/node-api';

describe.each([
  { type: 'mysql', load: loadMySQL, alias: 'mysql_source', port: 3306 },
  { type: 'postgres', load: loadPostgreSQL, alias: 'pg_source', port: 5432 },
])('loaders/$type native setup', ({ type, load, alias, port }) => {
  it('attaches read-only with a temporary secret and uses the remote catalog', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const runAndReadAll = vi.fn().mockResolvedValue({ getRowObjectsJson: () => [{ table_name: 'orders' }] });
    const source = await load({ host: 'localhost', database: 'sales db', user: "O'Brien", password: "p a'ss\\word" });
    try {
      await expect(source.register({ run, runAndReadAll } as unknown as DuckDBConnection)).resolves.toEqual(['orders']);
      const statements = run.mock.calls.map(([sql]) => sql);
      expect(statements.slice(0, 2)).toEqual([`INSTALL ${type}`, `LOAD ${type}`]);
      expect(statements[2]).toContain(`CREATE TEMPORARY SECRET ava_source_${type}`);
      expect(statements[2]).toContain(`TYPE ${type}, HOST 'localhost', PORT ${port}`);
      expect(statements[2]).toContain("DATABASE 'sales db'");
      expect(statements[2]).toContain("USER 'O''Brien'");
      expect(statements[2]).toContain("PASSWORD 'p a''ss\\word'");
      expect(statements[3]).toBe(`ATTACH '' AS ${alias} (TYPE ${type}, READ_ONLY, SECRET ava_source_${type})`);
      expect(statements).toHaveLength(5);
      expect(statements[4]).toBe(`USE "${alias}"."${type === 'mysql' ? 'sales db' : 'public'}"`);
    } finally {
      await source.cleanup();
    }
  });
});
