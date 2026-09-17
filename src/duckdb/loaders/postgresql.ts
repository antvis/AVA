/**
 * PostgreSQL loader: ATTACH a PostgreSQL database through DuckDB's postgres
 * extension and register one view per table in the schema. Supports an optional SSH tunnel.
 * https://duckdb.org/docs/lts/core_extensions/postgres
 */

import { escapeSql, sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import { createSshTunnel } from './util/ssh';

import type { PostgreSQLSourceOptions, LoadedSource } from '../../types';

const ATTACH_ALIAS = 'pg_source';

/** Build the space-separated `key=value` connection string DuckDB's postgres extension expects */
function buildConnectionString(options: PostgreSQLSourceOptions): string {
  const parts: Array<[string, string]> = [
    ['host', options.host],
    ['port', String(options.port ?? 5432)],
    ['dbname', options.database],
  ];
  if (options.user) parts.push(['user', options.user]);
  if (options.password) parts.push(['password', options.password]);
  return parts.map(([key, value]) => `${key}=${value}`).join(' ');
}

export async function loadPostgreSQL(options: PostgreSQLSourceOptions): Promise<LoadedSource> {
  // Open the SSH tunnel first; ATTACH then targets the local forwarded port
  const tunnel = options.ssh
    ? await createSshTunnel(options.ssh, options.host, options.port ?? 5432)
    : undefined;
  const attachOptions = tunnel
    ? { ...options, host: '127.0.0.1', port: tunnel.localPort, ssh: undefined }
    : options;
  const schema = options.schema ?? 'public';

  return {
    register: async (conn) => {
      try {
        await conn.run('LOAD postgres');
        // READ_ONLY keeps the analysis read-only against the source database
        await conn.run(
          `ATTACH '${escapeSql(buildConnectionString(attachOptions))}' AS ${ATTACH_ALIAS} (TYPE postgres, READ_ONLY)`
        );

        // Discover every table in the attached schema and expose each as a view
        const tablesReader = await conn.runAndReadAll(
          `SELECT table_name FROM information_schema.tables
           WHERE table_catalog = ${sqlStringLiteral(ATTACH_ALIAS)}
             AND table_schema = ${sqlStringLiteral(schema)}
           ORDER BY table_name`
        );
        const tableNames = tablesReader
          .getRowObjectsJson()
          .map((row: any) => String(row.table_name));

        for (const table of tableNames) {
          await conn.run(
            `CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS SELECT * FROM ${sqlIdentifier(
              ATTACH_ALIAS
            )}.${sqlIdentifier(schema)}.${sqlIdentifier(table)}`
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
