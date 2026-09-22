/** DuckDB catalog metadata. */
import { sqlStringLiteral, sqlUnionAll } from '../../util/sql';
import { rowObjects2Schema } from '../../util/schema';

import type { DuckDBConnection, Schema } from '../../types';

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

/** Map keys to indexes/relationships; preserve composite FK column pairs. */
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

/** Preserve index DDL for column extraction. */
function indexesSQL(tableNames?: string[]): string {
  const names = tableNames?.map(sqlStringLiteral).join(', ');
  return `
SELECT
  'index' AS kind,
  table_name,
  json_object(
    'name', index_name,
    'unique', is_unique,
    'primary', false,
    'definition', sql
  )::VARCHAR AS metadata
FROM duckdb_indexes()
WHERE database_name = current_database()
  AND schema_name = current_schema()
  AND ${names === undefined ? 'TRUE' : `table_name IN (${names || 'NULL'})`}`.trim();
}

/** Read the current namespace; tableNames limits scope and preserves order ([] skips querying). */
export async function getDuckDBSchema(conn: DuckDBConnection, tableNames?: string[]): Promise<Schema> {
  if (tableNames?.length === 0) return { tables: [], relationships: [] };

  const sql = sqlUnionAll([columnsSQL(tableNames), constraintsSQL(tableNames), indexesSQL(tableNames)]);

  const reader = await conn.runAndReadAll(sql);
  return rowObjects2Schema(reader.getRowObjectsJson());
}
