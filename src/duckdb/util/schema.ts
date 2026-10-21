/** DuckDB catalog metadata. */
import { sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';

import type { DuckDBConnection, Schema } from '../../types';

/** Source identity and canonical view definitions are available without scanning table data. */
function objectsSQL(tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  const scope = (name: string) => `database_name = current_database() AND schema_name = current_schema()
    AND ${names === undefined ? 'TRUE' : `${name} IN (${names || 'NULL'})`}`;
  return sqlUnionAll([
    `SELECT 'table' AS kind, table_name,
      json_object('catalog', database_name, 'schema', schema_name)::VARCHAR AS metadata
      FROM duckdb_tables() WHERE ${scope('table_name')} AND NOT internal`,
    `SELECT 'view' AS kind, view_name AS table_name,
      json_object('catalog', database_name, 'schema', schema_name, 'sql', sql)::VARCHAR AS metadata
      FROM duckdb_views() WHERE ${scope('view_name')} AND NOT internal`,
    `SELECT 'index' AS kind, table_name,
      json_object('unique', true, 'definition', sql)::VARCHAR AS metadata
      FROM duckdb_indexes() WHERE ${scope('table_name')} AND is_unique`,
  ]);
}

/** Preserve column order. */
function columnsSQL(tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  return `
SELECT
  'column' AS kind,
  table_name,
  json_object(
    'name', column_name,
    'type', data_type,
    'nullable', is_nullable,
    'position', column_index
  )::VARCHAR AS metadata
FROM duckdb_columns()
WHERE database_name = current_database()
  AND schema_name = current_schema()
  AND ${names === undefined ? 'TRUE' : `table_name IN (${names || 'NULL'})`}`.trim();
}

/** Map keys to indexes/relations; preserve composite FK column pairs. */
function constraintsSQL(tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  return `
SELECT
  CASE WHEN constraint_type = 'FOREIGN KEY' THEN 'foreign-key' ELSE 'index' END AS kind,
  table_name,
  json_object(
    'name', constraint_name,
    'columns', constraint_column_names,
    'unique', true,
    'primary', constraint_type = 'PRIMARY KEY',
    'referencedTable', referenced_table,
    'referencedColumns', referenced_column_names
  )::VARCHAR AS metadata
FROM duckdb_constraints()
WHERE database_name = current_database()
  AND schema_name = current_schema()
  AND ${names === undefined ? 'TRUE' : `table_name IN (${names || 'NULL'})`}
  AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')`.trim();
}

/** Read the current namespace; an empty scope skips querying. */
export async function getDuckDBSchema(conn: DuckDBConnection, tableNames?: string[]): Promise<Schema> {
  if (tableNames?.length === 0) return { models: [], relationships: [], views: [] };

  const sql = sqlUnionAll([objectsSQL(tableNames), columnsSQL(tableNames), constraintsSQL(tableNames)]);
  const reader = await conn.runAndReadAll(sql);
  return rowObjects2Schema(reader.getRowObjectsJson());
}
