/** Read a local SQLite database through DuckDB's official SQLite extension. */
import { dirname, resolve } from 'node:path';

import { sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';

import type { LoadedSource, SQLiteSourceOptions } from '../../types';

const ATTACH_ALIAS = 'sqlite_source';

/** Preserve native types, column order and SQLite's primary-key nullability. */
function columnsSQL(): string {
  return `
SELECT 'column' AS kind, c.table_name,
  json_object(
    'name', c.name, 'type', c.type, 'position', c.cid,
    'nullable', NOT (c."notnull" OR (c.pk > 0 AND NOT EXISTS (
      SELECT 1 FROM indexes i WHERE i.table_name = c.table_name AND i.origin = 'pk'
    )))
  ) AS metadata
FROM columns c`.trim();
}

/** Read ordinary and constraint-backed indexes in key order. */
function indexesSQL(): string {
  // ponytail: Schema has no predicates/expressions; skip partial/expression indexes until it does.
  return `
SELECT 'index-column' AS kind, i.table_name,
  json_object(
    'name', i.name, 'column', x.name, 'position', x.seqno + 1,
    'unique', i."unique", 'primary', i.origin = 'pk'
  )
FROM indexes i, pragma_index_xinfo(i.name) x
WHERE x."key" = 1 AND i.partial = 0`.trim();
}

/** Rowid primary keys have no index entry; label them PRIMARY. */
function primaryKeysSQL(): string {
  return `
SELECT 'index-column' AS kind, c.table_name,
  json_object(
    'name', 'PRIMARY', 'column', c.name, 'position', c.pk,
    'unique', 1, 'primary', 1
  )
FROM columns c
WHERE c.pk > 0 AND NOT EXISTS (
  SELECT 1 FROM indexes i WHERE i.table_name = c.table_name AND i.origin = 'pk'
)`.trim();
}

/** Pair composite keys by position; SQLite exposes FK IDs rather than names. */
function foreignKeysSQL(): string {
  return `
SELECT 'foreign-key-column' AS kind, t.name,
  json_object(
    'name', 'fk_' || f.id, 'column', c.name, 'position', f.seq + 1,
    'referencedTable', target.name, 'referencedColumn', parent.name
  )
FROM exposed t, pragma_foreign_key_list(t.name) f
JOIN exposed target ON target.name = f."table" COLLATE NOCASE
JOIN columns c ON c.table_name = t.name AND c.name = f."from" COLLATE NOCASE
JOIN columns parent ON parent.table_name = target.name AND (
  (f."to" IS NOT NULL AND parent.name = f."to" COLLATE NOCASE)
  OR (f."to" IS NULL AND parent.pk = f.seq + 1)
)`.trim();
}

/** Read native metadata for exactly the tables registered in DuckDB. */
function schemaSQL(tableNames: string[]): string {
  return `
WITH exposed AS (
  SELECT name FROM sqlite_schema
  WHERE name IN (${tableNames.map(sqlStringLiteral).join(', ') || 'NULL'})
    AND type IN ('table', 'view')
), columns AS (
  SELECT t.name AS table_name, c.* FROM exposed t, pragma_table_xinfo(t.name) c
  WHERE c.hidden != 1
), indexes AS (
  SELECT t.name AS table_name, i.* FROM exposed t, pragma_index_list(t.name) i
)
${sqlUnionAll([columnsSQL(), indexesSQL(), primaryKeysSQL(), foreignKeysSQL()])}`;
}

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
           AND lower(substr(table_name, 1, 7)) <> 'sqlite_'
         ORDER BY table_name`
      );
      tableNames = reader.getRowObjectsJson().map((row) => String(row.table_name));
      const generatedReader = await conn.runAndReadAll(
        `SELECT * FROM sqlite_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(
          "SELECT DISTINCT t.name FROM sqlite_schema t, pragma_table_xinfo(t.name) c WHERE t.type = 'table' AND c.hidden IN (2, 3)"
        )})`
      );
      const generatedTables = new Set(generatedReader.getRowObjectsJson().map((row) => String(row.name)));
      for (const table of tableNames) {
        // The attached catalog omits generated columns; native queries expose them.
        const source = generatedTables.has(table)
          ? `sqlite_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(`SELECT * FROM ${sqlIdentifier(table)}`)})`
          : `${ATTACH_ALIAS}.main.${sqlIdentifier(table)}`;
        await conn.run(`CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS SELECT * FROM ${source}`);
      }
      return tableNames;
    },
    getSchema: async (conn) => {
      const reader = await conn.runAndReadAll(
        `SELECT * FROM sqlite_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(schemaSQL(tableNames))})`
      );
      return rowObjects2Schema(reader.getRowObjectsJson());
    },
    allowedDirectories: [dirname(filePath)],
    // The engine closes the attached database when its connection is disposed.
    cleanup: async () => {},
  };
}
