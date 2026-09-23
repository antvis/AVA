/** Read a local SQLite database through DuckDB's official SQLite extension. */
import { dirname, resolve } from 'node:path';

import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import type { LoadedSource, SQLiteSourceOptions } from '../../types';

const ATTACH_ALIAS = 'sqlite_source';

export async function loadSQLite(options: SQLiteSourceOptions): Promise<LoadedSource> {
  const filePath = resolve(options.path);
  let tableNames: string[] = [];

  return {
    register: async (conn) => {
      await conn.run('INSTALL sqlite');
      await conn.run('LOAD sqlite');
      await conn.run(`ATTACH ${sqlStringLiteral(filePath)} AS ${ATTACH_ALIAS} (TYPE sqlite, READ_ONLY)`);
      const reader = await conn.runAndReadAll(
        `SELECT table_name FROM information_schema.tables
         WHERE table_catalog = ${sqlStringLiteral(ATTACH_ALIAS)} AND table_schema = 'main'
         ORDER BY table_name`
      );
      tableNames = reader.getRowObjectsJson().map((row) => String(row.table_name));
      for (const table of tableNames) {
        await conn.run(
          `CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS SELECT * FROM ${ATTACH_ALIAS}.main.${sqlIdentifier(table)}`
        );
      }
      return tableNames;
    },
    // ponytail: view metadata omits SQLite keys/indexes; use source PRAGMAs if needed.
    getSchema: (conn) => getDuckDBSchema(conn, tableNames),
    allowedDirectories: [dirname(filePath)],
    // The engine closes the attached database when its connection is disposed.
    cleanup: async () => {},
  };
}
