/**
 * PostgreSQL loader: ATTACH a PostgreSQL database through DuckDB's postgres
 * extension and register one view per table in the schema. Supports an optional SSH tunnel.
 * https://duckdb.org/docs/2.0/core_extensions/postgres
 */

import { sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';
import { createSshTunnel } from '../util/ssh';

import type { PostgreSQLSourceOptions, LoadedSource } from '../../types';

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
    'notNull', a.attnotnull,
    'position', a.attnum
  )::text AS metadata
FROM exposed t
JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid
WHERE a.attnum > 0 AND NOT a.attisdropped`.trim();
}

/** Read only complete, unconditional unique keys directly from the catalog. */
function indexesSQL(): string {
  return `
SELECT
  'index' AS kind,
  t.relname AS table_name,
  json_build_object(
    'name', ic.relname,
    'unique', i.indisunique,
    'primary', i.indisprimary,
    'columns', ARRAY(
      SELECT a.attname
      FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, position)
      JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      WHERE k.position <= i.indnkeyatts
      ORDER BY k.position
    )
  )::text AS metadata
FROM exposed t
JOIN pg_catalog.pg_index i ON i.indrelid = t.oid
JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid
WHERE i.indisunique AND i.indisvalid AND i.indpred IS NULL AND i.indexprs IS NULL`.trim();
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

export async function loadPostgreSQL(options: PostgreSQLSourceOptions): Promise<LoadedSource> {
  // Open the SSH tunnel first; ATTACH then targets the local forwarded port
  const tunnel = options.ssh ? await createSshTunnel(options.ssh, options.host, options.port ?? 5432) : undefined;
  const attachOptions = tunnel ? { ...options, host: '127.0.0.1', port: tunnel.localPort, ssh: undefined } : options;
  const schema = options.schema ?? 'public';

  return {
    register: async (conn) => {
      try {
        await conn.run('INSTALL postgres');
        await conn.run('LOAD postgres');
        const { host, port, database, user, password } = attachOptions;
        await conn.run(`CREATE TEMPORARY SECRET ava_source_postgres (
          TYPE postgres, HOST ${sqlStringLiteral(host)}, PORT ${port ?? 5432},
          DATABASE ${sqlStringLiteral(database)}
          ${user === undefined ? '' : `, USER ${sqlStringLiteral(user)}`}
          ${password === undefined ? '' : `, PASSWORD ${sqlStringLiteral(password)}`}
        )`);
        await conn.run(`ATTACH '' AS ${ATTACH_ALIAS} (TYPE postgres, READ_ONLY, SECRET ava_source_postgres)`);

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
