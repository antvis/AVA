import { rowObjects2Schema } from '../../util/schema';
import { sqlIdentifier } from '../../util/sql';

import type { Schema } from '../../contracts/schema';

/** The database and schema whose tables and views a Snowflake source exposes. */
export interface SnowflakeScope {
  database: string;
  schema: string;
}

type Row = Record<string, unknown>;
type RunQuery = (sql: string, binds?: string[]) => Promise<Row[]>;

/** The default (maximum) VARCHAR length adds no information, so it is omitted. */
const MAX_VARCHAR_LENGTH = 16_777_216;

/**
 * Write an INFORMATION_SCHEMA.COLUMNS type the way Snowflake DDL does, e.g. NUMBER(12,2) or
 * VARCHAR(25). The view reports no length for BINARY columns, so they appear as BINARY.
 */
export function columnType(row: Row): string {
  const type = String(row.DATA_TYPE);
  const length = Number(row.CHARACTER_MAXIMUM_LENGTH);
  switch (type) {
    case 'NUMBER':
      return `NUMBER(${row.NUMERIC_PRECISION},${row.NUMERIC_SCALE})`;
    case 'TEXT':
      return length > 0 && length < MAX_VARCHAR_LENGTH ? `VARCHAR(${length})` : 'VARCHAR';
    case 'TIME':
    case 'TIMESTAMP_LTZ':
    case 'TIMESTAMP_NTZ':
    case 'TIMESTAMP_TZ':
      return row.DATETIME_PRECISION == null ? type : `${type}(${row.DATETIME_PRECISION})`;
    default:
      return type;
  }
}

/**
 * Discover tables, views and declared keys of one schema. INFORMATION_SCHEMA views and SHOW output
 * list only objects the session's role may access, so the result is the authorized scope. Snowflake
 * constraints are informational (not enforced), but they are the declared keys this schema reports.
 */
export async function getSnowflakeSchema(runQuery: RunQuery, { database, schema }: SnowflakeScope): Promise<Schema> {
  const scope = `${sqlIdentifier(database)}.${sqlIdentifier(schema)}`;
  const [columns, primaryKeys, uniqueKeys, foreignKeys] = await Promise.all([
    runQuery(
      `SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, IS_NULLABLE, DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, DATETIME_PRECISION
      FROM ${sqlIdentifier(database)}.INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [schema]
    ),
    runQuery(`SHOW PRIMARY KEYS IN SCHEMA ${scope}`),
    runQuery(`SHOW UNIQUE KEYS IN SCHEMA ${scope}`),
    runQuery(`SHOW IMPORTED KEYS IN SCHEMA ${scope}`),
  ]);

  const tables = new Set(columns.map((row) => String(row.TABLE_NAME)));
  const exposed = (table: unknown) => tables.has(String(table));
  const key = (primary: boolean) => (row: Row) => ({
    kind: 'index-column',
    table_name: row.table_name,
    metadata: { name: row.constraint_name, unique: true, primary, column: row.column_name, position: row.key_sequence },
  });

  return rowObjects2Schema([
    ...columns.map((row) => ({
      kind: 'column',
      table_name: row.TABLE_NAME,
      metadata: {
        catalog: database,
        schema,
        name: row.COLUMN_NAME,
        type: columnType(row),
        notNull: row.IS_NULLABLE === 'NO',
        position: row.ORDINAL_POSITION,
      },
    })),
    ...primaryKeys.filter((row) => exposed(row.table_name)).map(key(true)),
    ...uniqueKeys.filter((row) => exposed(row.table_name)).map(key(false)),
    // Only keys whose referenced table is part of this source become relationships.
    ...foreignKeys
      .filter(
        (row) =>
          row.pk_database_name === database &&
          row.pk_schema_name === schema &&
          exposed(row.fk_table_name) &&
          exposed(row.pk_table_name)
      )
      .map((row) => ({
        kind: 'foreign-key-column',
        table_name: row.fk_table_name,
        metadata: {
          name: row.fk_name,
          column: row.fk_column_name,
          referencedTable: row.pk_table_name,
          referencedColumn: row.pk_column_name,
          position: row.key_sequence,
        },
      })),
  ]);
}
