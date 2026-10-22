/** Read a local SQLite database through DuckDB's official SQLite extension. */
import { resolve } from 'node:path';

import { sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';

import type { LoadedSource, SQLiteSourceOptions } from '../../types';

const ATTACH_ALIAS = 'sqlite_source';

/** Wrap native SQLite SQL as a DuckDB table function. */
function sqliteQuerySQL(sql: string): string {
  return `sqlite_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(sql)})`;
}

/** Preserve native types, column order and SQLite's primary-key nullability. */
function columnsSQL(allVarchar: boolean): string {
  return `
SELECT 'column' AS kind, c.table_name,
  json_object(
    'name', c.name, 'type', ${allVarchar ? "'VARCHAR'" : 'c.type'}, 'position', c.cid,
    'notNull', (c."notnull" OR (c.pk > 0 AND NOT EXISTS (
      SELECT 1 FROM indexes i WHERE i.table_name = c.table_name AND i.origin = 'pk'
    )))
  ) AS metadata
FROM columns c`.trim();
}

/** Read ordinary and constraint-backed indexes in key order. */
function indexesSQL(): string {
  // shortcut: Schema cannot represent partial/expression indexes; expose only ordinary keys until it can.
  return `
SELECT 'index-column' AS kind, i.table_name,
  json_object(
    'name', i.name, 'column', x.name, 'position', x.seqno + 1,
    'unique', i."unique", 'primary', i.origin = 'pk'
  )
FROM indexes i, pragma_index_xinfo(i.name) x
WHERE x."key" = 1 AND i.partial = 0
  AND NOT EXISTS (
    SELECT 1 FROM pragma_index_xinfo(i.name) e WHERE e."key" = 1 AND NOT EXISTS (
      SELECT 1 FROM columns c WHERE c.table_name = i.table_name AND c.name = e.name
    )
  )`.trim();
}

/** SQLite reserves sqlite_* names, so this label cannot collide with a user index. */
function primaryKeysSQL(): string {
  return `
SELECT 'index-column' AS kind, c.table_name,
  json_object(
    'name', 'sqlite_primary_key_' || c.table_name, 'column', c.name, 'position', c.pk,
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

/** Use table_info like the native scanner, which currently omits generated columns. */
function schemaSQL(tableNames: string[], allVarchar: boolean): string {
  return `
WITH exposed AS (
  SELECT name FROM sqlite_schema
  WHERE name IN (${tableNames.map(sqlStringLiteral).join(', ') || 'NULL'})
    AND type IN ('table', 'view')
), columns AS (
  SELECT t.name AS table_name, c.* FROM exposed t, pragma_table_info(t.name) c
), indexes AS (
  SELECT t.name AS table_name, i.* FROM exposed t, pragma_index_list(t.name) i
)
${sqlUnionAll([columnsSQL(allVarchar), indexesSQL(), primaryKeysSQL(), foreignKeysSQL()])}`;
}

export async function loadSQLite(options: SQLiteSourceOptions): Promise<LoadedSource> {
  const filePath = resolve(options.path);
  let tableNames: string[] = [];

  return {
    register: async (conn) => {
      await conn.run('INSTALL sqlite');
      await conn.run('LOAD sqlite');
      if (options.allVarchar) await conn.run('SET GLOBAL sqlite_all_varchar = true');
      await conn.run(`ATTACH ${sqlStringLiteral(filePath)} AS ${ATTACH_ALIAS} (TYPE sqlite, READ_ONLY)`);
      const tablesReader = await conn.runAndReadAll(
        `SELECT * FROM ${sqliteQuerySQL(
          `SELECT name FROM sqlite_schema
           WHERE type IN ('table', 'view') AND lower(substr(name, 1, 7)) <> 'sqlite_'
           ORDER BY name`
        )}`
      );
      tableNames = tablesReader.getRowObjectsJson().map((row) => String(row.name));
      await conn.run(`USE ${sqlIdentifier(ATTACH_ALIAS)}.main`);
      return tableNames;
    },
    getSchema: async (conn) => {
      const reader = await conn.runAndReadAll(
        `SELECT * FROM ${sqliteQuerySQL(schemaSQL(tableNames, !!options.allVarchar))}`
      );
      return rowObjects2Schema(reader.getRowObjectsJson());
    },
    allowedDirectories: [],
    allowedPaths: [filePath],
    // The engine closes the attached database when its connection is disposed.
    cleanup: async () => {},
  };
}
