/**
 * MongoDB loader: ATTACH a MongoDB database through DuckDB's mongo community
 * extension and register one view per collection.
 * https://duckdb.org/community_extensions/extensions/mongo
 */

import { getDuckDBSchema } from '../util/schema';
import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import type { LoadedSource, MongoDBSourceOptions } from '../../types';

const ATTACH_ALIAS = 'mongo_source';
const noopCleanup = async (): Promise<void> => {};

function buildConnectionString(options: MongoDBSourceOptions): string {
  const { connection, database } = options;
  if (/(?:^|\s)(?:db|dbname|database)=/i.test(connection)) return connection;
  if (/^mongodb(?:\+srv)?:\/\//i.test(connection)) {
    const url = new URL(connection);
    if (url.pathname && url.pathname !== '/') return connection;
    url.pathname = `/${database}`;
    return url.toString();
  }
  return `${connection}${/\s$/.test(connection) ? '' : ' '}dbname=${database}`;
}

export async function loadMongoDB(options: MongoDBSourceOptions): Promise<LoadedSource> {
  let tableNames: string[] = [];

  return {
    register: async (conn) => {
      await conn.run('INSTALL mongo FROM community');
      await conn.run('LOAD mongo');
      await conn.run('SET mongo_enable_direct_scan = false');
      await conn.run(
        `ATTACH ${sqlStringLiteral(buildConnectionString(options))} AS ${ATTACH_ALIAS} (TYPE MONGO)`
      );

      const tablesReader = await conn.runAndReadAll(
        `SELECT table_name FROM information_schema.tables
         WHERE table_catalog = ${sqlStringLiteral(ATTACH_ALIAS)}
           AND table_schema = ${sqlStringLiteral(options.database)}
         ORDER BY table_name`
      );
      tableNames = tablesReader.getRowObjectsJson().map((row: any) => String(row.table_name));

      for (const table of tableNames) {
        await conn.run(
          `CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS SELECT * FROM ${sqlIdentifier(
            ATTACH_ALIAS
          )}.${sqlIdentifier(options.database)}.${sqlIdentifier(table)}`
        );
      }
      return tableNames;
    },
    getSchema: (conn) => getDuckDBSchema(conn, tableNames),
    allowedDirectories: [],
    cleanup: noopCleanup,
  };
}
