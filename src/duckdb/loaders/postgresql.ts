/**
 * PostgreSQL loader: ATTACH a PostgreSQL database through DuckDB's postgres
 * extension and register one view per table in the schema. Supports an optional SSH tunnel.
 * https://duckdb.org/docs/lts/core_extensions/postgres
 */

import { escapeSql, sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';
import { createSshTunnel } from '../util/ssh';

import type { DuckDBConnection, PostgreSQLSourceOptions, LoadedSource, Schema } from '../../types';

const ATTACH_ALIAS = 'pg_source';

/** Restrict all branches to readable relations in the requested schema. */
function exposedSQL(schema: string): string {
  return `
SELECT t.oid, t.relname
FROM pg_catalog.pg_class t
JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = ${sqlStringLiteral(schema)}
  AND t.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND has_table_privilege(t.oid, 'SELECT')`.trim();
}

function tablesSQL(): string {
  return `
SELECT
  'table' AS kind,
  relname AS table_name,
  '{}'::text AS metadata
FROM exposed`.trim();
}

/** Preserve native types and column order; exclude dropped/system columns. */
function columnsSQL(): string {
  return `
SELECT
  'column' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', a.attname,
    'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
    'nullable', NOT a.attnotnull,
    'position', a.attnum
  )::text AS metadata
FROM exposed t
JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid
WHERE a.attnum > 0 AND NOT a.attisdropped`.trim();
}

/** Preserve index DDL and primary/unique flags. */
function indexesSQL(): string {
  return `
SELECT
  'index' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', ic.relname,
    'unique', i.indisunique,
    'primary', i.indisprimary,
    'definition', pg_catalog.pg_get_indexdef(i.indexrelid)
  )::text AS metadata
FROM exposed t
JOIN pg_catalog.pg_index i ON i.indrelid = t.oid
JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid`.trim();
}

/** Pair composite FK columns by position; both tables must be exposed. */
function foreignKeysSQL(): string {
  return `
SELECT
  'foreign-key-column' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', c.conname,
    'column', a.attname,
    'referencedTable', rt.relname,
    'referencedColumn', ra.attname,
    'position', k.ordinality
  )::text AS metadata
FROM pg_catalog.pg_constraint c
JOIN exposed t ON t.oid = c.conrelid
JOIN exposed rt ON rt.oid = c.confrelid
CROSS JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS k(local_attnum, remote_attnum, ordinality)
JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.local_attnum
JOIN pg_catalog.pg_attribute ra ON ra.attrelid = rt.oid AND ra.attnum = k.remote_attnum
WHERE c.contype = 'f'`.trim();
}

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
  const tunnel = options.ssh ? await createSshTunnel(options.ssh, options.host, options.port ?? 5432) : undefined;
  const attachOptions = tunnel ? { ...options, host: '127.0.0.1', port: tunnel.localPort, ssh: undefined } : options;
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
        const tableNames = tablesReader.getRowObjectsJson().map((row: any) => String(row.table_name));

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
    getSchema: async (conn) => {
      const sql = `WITH exposed AS (\n${exposedSQL(schema)}\n)\n${sqlUnionAll([
        tablesSQL(),
        columnsSQL(),
        indexesSQL(),
        foreignKeysSQL(),
      ])}`;

      const reader = await conn.runAndReadAll(
        `SELECT * FROM postgres_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(sql)})`
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
