/**
 * MySQL loader: ATTACH a MySQL database through DuckDB's mysql extension and
 * register one view per table in the database. Supports an optional SSH tunnel.
 * https://duckdb.org/docs/lts/core_extensions/mysql
 */

import { escapeSql, sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import { createSshTunnel } from './util/ssh';

import type { MySQLSourceOptions, LoadedSource } from '../../types';

const ATTACH_ALIAS = 'mysql_source';

/** Build the space-separated `key=value` connection string DuckDB's mysql extension expects */
function buildConnectionString(options: MySQLSourceOptions): string {
  const parts: Array<[string, string]> = [
    ['host', options.host],
    ['port', String(options.port ?? 3306)],
    ['database', options.database],
  ];
  if (options.user) parts.push(['user', options.user]);
  if (options.password) parts.push(['password', options.password]);
  return parts.map(([key, value]) => `${key}=${value}`).join(' ');
}

export async function loadMySQL(options: MySQLSourceOptions): Promise<LoadedSource> {
  // Open the SSH tunnel first; ATTACH then targets the local forwarded port
  const tunnel = options.ssh
    ? await createSshTunnel(options.ssh, options.host, options.port ?? 3306)
    : undefined;
  const attachOptions = tunnel
    ? { ...options, host: '127.0.0.1', port: tunnel.localPort, ssh: undefined }
    : options;

  return {
    register: async (conn) => {
      try {
        await conn.run('LOAD mysql');
        // READ_ONLY keeps the analysis read-only against the source database
        await conn.run(
          `ATTACH '${escapeSql(buildConnectionString(attachOptions))}' AS ${ATTACH_ALIAS} (TYPE mysql, READ_ONLY)`
        );

        // Discover every table in the attached database and expose each as a view
        const tablesReader = await conn.runAndReadAll(
          `SELECT table_name FROM information_schema.tables
           WHERE table_catalog = ${sqlStringLiteral(ATTACH_ALIAS)}
             AND table_schema = ${sqlStringLiteral(options.database)}
           ORDER BY table_name`
        );
        const tableNames = tablesReader
          .getRowObjectsJson()
          .map((row: any) => String(row.table_name));

        for (const table of tableNames) {
          await conn.run(
            `CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS SELECT * FROM ${sqlIdentifier(
              ATTACH_ALIAS
            )}.${sqlIdentifier(options.database)}.${sqlIdentifier(table)}`
          );
        }
        return tableNames;
      } catch (error) {
        await tunnel?.close();
        throw error;
      }
    },
    // Pure remote source — no local file access needed after ATTACH
    allowedDirectories: [],
    cleanup: async () => {
      await tunnel?.close();
    },
  };
}
