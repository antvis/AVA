/**
 * Snowflake schema discovery through INFORMATION_SCHEMA tables/columns and
 * SHOW PRIMARY KEYS. The queries are deliberately flat (no JOINs) so they run
 * on both the production driver adapter and the built-in mock connector; each
 * returns regular rows that the engine assembles into a Schema.
 *
 * Snowflake identifiers are case-insensitive and fold to uppercase unless
 * double-quoted, so the catalog filters compare against upper-cased names.
 */
import { sqlIdentifier } from '../../util/sql';

import type { Schema } from '../../types';

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  table_name: string;
  name: string;
  type: string;
  nullable: boolean | string;
}

interface KeyRow {
  database_name: string;
  schema_name: string;
  table_name: string;
  column_name: string;
  key_sequence: number | string;
}

function bool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'YES';
}

/** Escape a value for a SQL string literal (Snowflake doubles single quotes). */
function literal(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Snowflake folds unquoted result aliases to uppercase; map only catalog keys. */
function normalizeCatalogRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase(), value])));
}

export async function getSnowflakeSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  database: string,
  schema: string
): Promise<Schema> {
  const databaseName = database.toUpperCase();
  const schemaName = schema.toUpperCase();
  const db = literal(databaseName);
  const sch = literal(schemaName);
  const qualifiedSchema = `${sqlIdentifier(databaseName)}.${sqlIdentifier(schemaName)}`;
  const queryCatalog = async (sql: string) => normalizeCatalogRows(await runQuery(sql));

  const tables = (await queryCatalog(`
    SELECT table_name AS table_name
    FROM INFORMATION_SCHEMA.TABLES
    WHERE table_catalog = ${db} AND table_schema = ${sch}
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)) as unknown as TableRow[];

  if (tables.length === 0) return { models: [], relationships: [] };

  const [columns, keys] = await Promise.all([
    queryCatalog(`
      SELECT
        table_name AS table_name,
        column_name AS name,
        data_type AS type,
        is_nullable AS nullable
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_catalog = ${db} AND table_schema = ${sch}
      ORDER BY table_name, ordinal_position
    `),
    queryCatalog(`SHOW PRIMARY KEYS IN SCHEMA ${qualifiedSchema}`),
  ]);

  const columnRows = columns as unknown as ColumnRow[];
  const keyRows = keys as unknown as KeyRow[];

  return {
    models: tables.map(({ table_name }) => {
      const fields = columnRows
        .filter((column) => column.table_name === table_name)
        .map((column) => ({ name: column.name, type: column.type, notNull: !bool(column.nullable) }));

      const primaryColumns = keyRows
        .filter((key) => key.table_name === table_name)
        .sort((a, b) => Number(a.key_sequence) - Number(b.key_sequence))
        .map((key) => key.column_name);

      return {
        name: table_name,
        tableReference: { catalog: database, schema: schemaName, table: table_name },
        columns: fields,
        ...(primaryColumns.length === 1
          ? { primaryKey: primaryColumns[0] }
          : primaryColumns.length > 1
          ? { primaryKey: primaryColumns as [string, ...string[]] }
          : {}),
      };
    }),
    relationships: [],
  };
}
