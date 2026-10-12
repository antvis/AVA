/** Read a local SQLite database through DuckDB's official SQLite extension. */
import { dirname, resolve } from 'node:path';

import { sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';

import type { LoadedSource, SQLiteSourceOptions } from '../../types';

const ATTACH_ALIAS = 'sqlite_source';

type SQLiteColumn = { name: string; type: string; storageTypes: string[]; resolvedType: string };

const MIXED_BLOB_TYPE = 'UNION(integer_value BIGINT, real_value DOUBLE, text_value VARCHAR, blob_value BLOB)';

/** Wrap native SQLite SQL as a DuckDB table function. */
function sqliteQuerySQL(sql: string): string {
  return `sqlite_query(${sqlStringLiteral(ATTACH_ALIAS)}, ${sqlStringLiteral(sql)})`;
}

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

/** Match the SQLite extension's declared-type mapping. */
function duckDBType(type: string): string {
  if (/INT/i.test(type)) return 'BIGINT';
  if (/CHAR|CLOB|TEXT/i.test(type)) return 'VARCHAR';
  if (!type || /BLOB/i.test(type)) return 'BLOB';
  if (/REAL|FLOA|DOUB|DEC|NUM/i.test(type)) return 'DOUBLE';
  if (/^DATE$/i.test(type)) return 'DATE';
  if (/TIME/i.test(type)) return 'TIMESTAMP';
  return 'VARCHAR';
}

/** SQLite declarations are affinities, not constraints. Inspect every row, not a sample. */
function resolvedType(declared: string, storageTypes: string[]): string {
  if (!storageTypes.length) return duckDBType(declared);
  if (storageTypes.includes('blob')) return storageTypes.length === 1 ? 'BLOB' : MIXED_BLOB_TYPE;
  if (storageTypes.includes('text')) return 'VARCHAR';
  if (storageTypes.includes('real') || duckDBType(declared) === 'DOUBLE') return 'DOUBLE';
  return 'BIGINT';
}

/** Native queries bypass the extension's affinity casts, including for generated columns. */
function tableSQL(table: string, fields: SQLiteColumn[]): string {
  const sourceColumns: string[] = [];
  const typedColumns = fields.map(({ name, resolvedType: type, storageTypes }, i) => {
    const column = sqlIdentifier(name);
    const value = sqlIdentifier(`v${i}`);
    const tag = sqlIdentifier(`t${i}`);

    if (type === MIXED_BLOB_TYPE) {
      sourceColumns.push(`typeof(${column}) AS ${tag}`);
      sourceColumns.push(`CASE WHEN typeof(${column}) = 'blob' THEN hex(${column}) ELSE ${column} END AS ${value}`);
      const members = { integer: 'BIGINT', real: 'DOUBLE', text: 'VARCHAR', blob: 'BLOB' };
      const branches = storageTypes.map((storage) => {
        const expression = storage === 'blob' ? `unhex(${value})` : `CAST(${value} AS ${members[storage]})`;
        return `WHEN ${sqlStringLiteral(storage)} THEN CAST(union_value(${storage}_value := ${expression}) AS ${type})`;
      });
      return `CASE ${tag} ${branches.join(' ')} END AS ${column}`;
    }

    sourceColumns.push(
      `${type === 'BLOB' ? `CASE WHEN ${column} IS NULL THEN NULL ELSE hex(${column}) END` : column} AS ${value}`
    );
    return `${type === 'BLOB' ? `unhex(${value})` : `CAST(${value} AS ${type})`} AS ${column}`;
  });
  const query = `SELECT ${sourceColumns.join(', ')} FROM ${sqlIdentifier(table)}`;
  return `SELECT ${typedColumns.join(', ')} FROM ${sqliteQuerySQL(query)}`;
}

export async function loadSQLite(options: SQLiteSourceOptions): Promise<LoadedSource> {
  const filePath = resolve(options.path);
  let tableNames: string[] = [];
  const columnsByTable = new Map<string, SQLiteColumn[]>();

  return {
    register: async (conn) => {
      await conn.run('INSTALL sqlite');
      await conn.run('LOAD sqlite');
      await conn.run(`ATTACH ${sqlStringLiteral(filePath)} AS ${ATTACH_ALIAS} (TYPE sqlite, READ_ONLY)`);
      const columnsReader = await conn.runAndReadAll(
        `SELECT * FROM ${sqliteQuerySQL(
          `SELECT t.name AS table_name, c.name, c.type, c.hidden
           FROM sqlite_schema t LEFT JOIN pragma_table_xinfo(t.name) c ON c.hidden != 1
           WHERE t.type IN ('table', 'view') AND lower(substr(t.name, 1, 7)) <> 'sqlite_'
           ORDER BY t.name, c.cid`
        )}`
      );
      columnsByTable.clear();
      for (const row of columnsReader.getRowObjectsJson()) {
        const table = String(row.table_name);
        const columns = columnsByTable.get(table) ?? [];
        if (row.name !== null) {
          columns.push({ name: String(row.name), type: String(row.type), storageTypes: [], resolvedType: '' });
        }
        columnsByTable.set(table, columns);
      }
      tableNames = [...columnsByTable.keys()];
      for (const [table, columns] of columnsByTable) {
        const storageQuery = `SELECT ${columns
          .map(({ name }, i) => `group_concat(DISTINCT typeof(${sqlIdentifier(name)})) AS ${sqlIdentifier(`c${i}`)}`)
          .join(', ')} FROM ${sqlIdentifier(table)}`;
        const observed = (
          await conn.runAndReadAll(`SELECT * FROM ${sqliteQuerySQL(storageQuery)}`)
        ).getRowObjectsJson()[0];
        columns.forEach((column, i) => {
          column.storageTypes = String(observed[`c${i}`] ?? '')
            .split(',')
            .filter((type) => type && type !== 'null');
          column.resolvedType = resolvedType(column.type, column.storageTypes);
        });
        await conn.run(`CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS ${tableSQL(table, columns)}`);
      }
      return tableNames;
    },
    getSchema: async (conn) => {
      const reader = await conn.runAndReadAll(`SELECT * FROM ${sqliteQuerySQL(schemaSQL(tableNames))}`);
      const schema = rowObjects2Schema(reader.getRowObjectsJson());
      for (const table of schema.tables) {
        for (const field of table.fields) {
          const column = columnsByTable.get(table.name)!.find((column) => column.name === field.name)!;
          // Retain native spelling only when it describes the exposed execution type.
          if (duckDBType(field.type) !== column.resolvedType) field.type = column.resolvedType;
        }
      }
      return schema;
    },
    allowedDirectories: [dirname(filePath)],
    // The engine closes the attached database when its connection is disposed.
    cleanup: async () => {},
  };
}
