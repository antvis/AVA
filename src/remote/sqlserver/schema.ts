/**
 * SQL Server schema discovery through INFORMATION_SCHEMA catalog views. The
 * queries are deliberately flat (no JOINs) so they run on both the tedious
 * adapter and the built-in mock connector; each returns regular rows that the
 * engine assembles into a Schema.
 */
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
  table_name: string;
  name: string;
  position: number;
}

function bool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'YES';
}

/** Escape a value for a SQL string literal (T-SQL doubles single quotes). */
function literal(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export async function getSqlServerSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  database: string
): Promise<Schema> {
  const db = literal(database);

  const tables = (await runQuery(`
    SELECT t.TABLE_NAME AS table_name
    FROM INFORMATION_SCHEMA.TABLES t
    WHERE t.TABLE_CATALOG = ${db} AND t.TABLE_TYPE = 'BASE TABLE'
    ORDER BY t.TABLE_NAME
  `)) as unknown as TableRow[];

  if (tables.length === 0) return { models: [], relationships: [] };

  const [columns, keys] = await Promise.all([
    runQuery(`
      SELECT
        c.TABLE_NAME AS table_name,
        c.COLUMN_NAME AS name,
        c.DATA_TYPE AS type,
        c.IS_NULLABLE AS nullable
      FROM INFORMATION_SCHEMA.COLUMNS c
      WHERE c.TABLE_CATALOG = ${db}
      ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
    `),
    runQuery(`
      SELECT
        k.TABLE_NAME AS table_name,
        k.COLUMN_NAME AS name,
        k.ORDINAL_POSITION AS position
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      WHERE k.TABLE_CATALOG = ${db}
      ORDER BY k.TABLE_NAME, k.ORDINAL_POSITION
    `),
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
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((key) => key.name);

      return {
        name: table_name,
        tableReference: { catalog: database, table: table_name },
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