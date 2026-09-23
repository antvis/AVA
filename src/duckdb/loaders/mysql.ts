/**
 * MySQL loader: ATTACH a MySQL database through DuckDB's mysql extension and
 * register one view per table in the database. Supports an optional SSH tunnel.
 * https://duckdb.org/docs/lts/core_extensions/mysql
 */

import { escapeSql, sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';
import { createSshTunnel } from '../util/ssh';

import type { MySQLSourceOptions, LoadedSource } from '../../types';

const ATTACH_ALIAS = 'mysql_source';

function tablesSQL(database: string): string {
  return `
SELECT
  'table' AS kind,
  TABLE_NAME AS table_name,
  '{}' AS metadata
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = ${sqlStringLiteral(database)}`.trim();
}

/** Preserve native types and column order. */
function columnsSQL(database: string): string {
  return `
SELECT
  'column' AS kind,
  TABLE_NAME AS table_name,
  JSON_OBJECT(
    'name', COLUMN_NAME,
    'type', COLUMN_TYPE,
    'nullable', IS_NULLABLE = 'YES',
    'position', ORDINAL_POSITION
  ) AS metadata
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = ${sqlStringLiteral(database)}`.trim();
}

/** Preserve index column order and primary/unique flags. */
function indexesSQL(database: string): string {
  return `
SELECT
  'index-column' AS kind,
  TABLE_NAME AS table_name,
  JSON_OBJECT(
    'name', INDEX_NAME,
    'column', COLUMN_NAME,
    'unique', NON_UNIQUE = 0,
    'primary', INDEX_NAME = 'PRIMARY',
    'position', SEQ_IN_INDEX
  ) AS metadata
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = ${sqlStringLiteral(database)}`.trim();
}

/** Preserve composite FK pairs within the source database. */
function foreignKeysSQL(database: string): string {
  return `
SELECT
  'foreign-key-column' AS kind,
  TABLE_NAME AS table_name,
  JSON_OBJECT(
    'name', CONSTRAINT_NAME,
    'column', COLUMN_NAME,
    'referencedTable', REFERENCED_TABLE_NAME,
    'referencedColumn', REFERENCED_COLUMN_NAME,
    'position', ORDINAL_POSITION
  ) AS metadata
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = ${sqlStringLiteral(database)}
  AND REFERENCED_TABLE_SCHEMA = ${sqlStringLiteral(database)}
  AND REFERENCED_TABLE_NAME IS NOT NULL`.trim();
}

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
  const tunnel = options.ssh ? await createSshTunnel(options.ssh, options.host, options.port ?? 3306) : undefined;
  const attachOptions = tunnel ? { ...options, host: '127.0.0.1', port: tunnel.localPort, ssh: undefined } : options;

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
        const tableNames = tablesReader.getRowObjectsJson().map((row: any) => String(row.table_name));

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
    getSchema: async (conn) => {
      const sql = sqlUnionAll([
        tablesSQL(options.database),
        columnsSQL(options.database),
        indexesSQL(options.database),
        foreignKeysSQL(options.database),
      ]);

      const reader = await conn.runAndReadAll(
        `SELECT * FROM mysql_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(sql)})`
      );
      return rowObjects2Schema(reader.getRowObjectsJson());
    },
    // Pure remote source — no local file access needed after ATTACH
    allowedDirectories: [],
    cleanup: async () => {
      await tunnel?.close();
    },
  };
}
