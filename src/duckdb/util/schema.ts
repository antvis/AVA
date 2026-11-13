/** DuckDB catalog metadata. */
import { sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';

import type { DuckDBConnection, Schema } from '../../types';

/** Source identity and canonical view definitions are available without scanning table data. */
function objectsSQL(schema: string, tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  const scope = (name: string) => `database_name = current_database() AND schema_name = ${schema}
    AND ${names === undefined ? 'TRUE' : `${name} IN (${names || 'NULL'})`}`;
  return sqlUnionAll([
    `SELECT 'table' AS kind, table_name,
      struct_pack(catalog := database_name, schema := schema_name) AS metadata
      FROM duckdb_tables() WHERE ${scope('table_name')} AND NOT internal`,
    `SELECT 'view' AS kind, view_name AS table_name,
      struct_pack(catalog := database_name, schema := schema_name, sql := sql) AS metadata
      FROM duckdb_views() WHERE ${scope('view_name')} AND NOT internal`,
    `SELECT 'index' AS kind, table_name,
      struct_pack("unique" := true, definition := sql) AS metadata
      FROM duckdb_indexes() WHERE ${scope('table_name')} AND is_unique`,
  ]);
}

/** Preserve column order. */
function columnsSQL(schema: string, tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  return `
SELECT
  'column' AS kind,
  table_name,
  struct_pack(
    name := column_name,
    type := data_type,
    notNull := NOT is_nullable,
    "position" := column_index
  ) AS metadata
FROM duckdb_columns()
WHERE database_name = current_database()
  AND schema_name = ${schema}
  AND ${names === undefined ? 'TRUE' : `table_name IN (${names || 'NULL'})`}`.trim();
}

/** Map keys to indexes/relations; preserve composite FK column pairs. */
function constraintsSQL(schema: string, tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  return `
SELECT
  CASE WHEN constraint_type = 'FOREIGN KEY' THEN 'foreign-key' ELSE 'index' END AS kind,
  table_name,
  struct_pack(
    name := constraint_name,
    "columns" := constraint_column_names,
    "unique" := true,
    "primary" := constraint_type = 'PRIMARY KEY',
    referencedTable := referenced_table,
    referencedColumns := referenced_column_names
  ) AS metadata
FROM duckdb_constraints()
WHERE database_name = current_database()
  AND schema_name = ${schema}
  AND ${names === undefined ? 'TRUE' : `table_name IN (${names || 'NULL'})`}
  AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')`.trim();
}

/**
 * Read the source namespace, or the current schema for a single source.
 */
export async function getDuckDBSchema(
  conn: DuckDBConnection,
  tableNames?: string[],
  namespace?: string
): Promise<Schema> {
  if (tableNames?.length === 0) return { models: [], relationships: [], views: [] };

  const schema = namespace === undefined ? 'current_schema()' : sqlStringLiteral(namespace);
  const sql = sqlUnionAll([
    objectsSQL(schema, tableNames),
    columnsSQL(schema, tableNames),
    constraintsSQL(schema, tableNames),
  ]);
  const reader = await conn.runAndReadAll(sql);
  return rowObjects2Schema(reader.getRowObjectsJson(), namespace);
}
