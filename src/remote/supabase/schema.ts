/** Supabase catalog queries use PostgreSQL syntax. */
import { rowObjects2Schema } from '../../util/schema';
import { sqlStringLiteral, sqlUnionAll } from '../../util/sql';

import type { Schema } from '../../types';

/** Only the public schema is read — Supabase user tables live there by default. */
export const SUPABASE_SCHEMA = 'public';

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
  '{}'::json AS metadata
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
  ) AS metadata
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
  ) AS metadata
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
  ) AS metadata
FROM pg_catalog.pg_constraint c
JOIN exposed t ON t.oid = c.conrelid
JOIN exposed rt ON rt.oid = c.confrelid
CROSS JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS k(local_attnum, remote_attnum, ordinality)
JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.local_attnum
JOIN pg_catalog.pg_attribute ra ON ra.attrelid = rt.oid AND ra.attnum = k.remote_attnum
WHERE c.contype = 'f'`.trim();
}

/** One read-only catalog query for fields, indexes and foreign keys. */
export async function getSupabaseSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>
): Promise<Schema> {
  const sql = `WITH exposed AS (\n${exposedSQL(SUPABASE_SCHEMA)}\n)\n${sqlUnionAll([
    tablesSQL(),
    columnsSQL(),
    indexesSQL(),
    foreignKeysSQL(),
  ])}`;

  const rows = await runQuery(sql);
  return rowObjects2Schema(rows);
}
