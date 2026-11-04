/**
 * SQL Server schema discovery through INFORMATION_SCHEMA catalog views. The
 * queries are deliberately flat (no JOINs) so they run on both the tedious
 * adapter and the built-in mock connector; each returns regular rows that the
 * engine assembles into a Schema.
 */
import type { Schema } from '../../types';

interface TableRow {
  table_schema: string;
  table_name: string;
}

interface ColumnRow extends TableRow {
  name: string;
  type: string;
  nullable: boolean | string;
}

interface KeyRow extends TableRow {
  constraint_name: string;
  name: string;
  position: number;
}

interface ConstraintRow extends TableRow {
  constraint_name: string;
}

function bool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'YES';
}

/** Escape a value for a SQL string literal (T-SQL doubles single quotes). */
function literal(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Catalog + schema + table (+ constraint) identity; table names are not unique alone. */
function identity(row: TableRow, constraint?: string): string {
  return `${row.table_schema}\u0000${row.table_name}${constraint === undefined ? '' : `\u0000${constraint}`}`;
}

export async function getSqlServerSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  database: string
): Promise<Schema> {
  const db = literal(database);

  const tables = (await runQuery(`
    SELECT t.TABLE_SCHEMA AS table_schema, t.TABLE_NAME AS table_name
    FROM INFORMATION_SCHEMA.TABLES t
    WHERE t.TABLE_CATALOG = ${db} AND t.TABLE_TYPE = 'BASE TABLE'
    ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
  `)) as unknown as TableRow[];

  if (tables.length === 0) return { models: [], relationships: [] };

  // A Tedious connection serves one request at a time, so catalog queries are
  // awaited sequentially instead of being issued concurrently.
  const columns = (await runQuery(`
    SELECT
      c.TABLE_SCHEMA AS table_schema,
      c.TABLE_NAME AS table_name,
      c.COLUMN_NAME AS name,
      c.DATA_TYPE AS type,
      c.IS_NULLABLE AS nullable
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_CATALOG = ${db}
    ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
  `)) as unknown as ColumnRow[];

  const keys = (await runQuery(`
    SELECT
      k.TABLE_SCHEMA AS table_schema,
      k.TABLE_NAME AS table_name,
      k.CONSTRAINT_NAME AS constraint_name,
      k.COLUMN_NAME AS name,
      k.ORDINAL_POSITION AS position
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
    WHERE k.TABLE_CATALOG = ${db}
    ORDER BY k.TABLE_SCHEMA, k.TABLE_NAME, k.ORDINAL_POSITION
  `)) as unknown as KeyRow[];

  const primaryConstraints = (await runQuery(`
    SELECT
      tc.TABLE_SCHEMA AS table_schema,
      tc.TABLE_NAME AS table_name,
      tc.CONSTRAINT_NAME AS constraint_name
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    WHERE tc.TABLE_CATALOG = ${db} AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
  `)) as unknown as ConstraintRow[];

  const primaryKeyNames = new Set(
    primaryConstraints.map((constraint) => identity(constraint, constraint.constraint_name))
  );
  const keyRows = keys.filter((key) => primaryKeyNames.has(identity(key, key.constraint_name)));

  return {
    models: tables.map((source) => {
      const fields = columns
        .filter((column) => identity(column) === identity(source))
        .map((column) => ({ name: column.name, type: column.type, notNull: !bool(column.nullable) }));

      const primaryColumns = keyRows
        .filter((key) => identity(key) === identity(source))
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((key) => key.name);
      const modelName = `${source.table_schema}.${source.table_name}`;

      return {
        name: modelName,
        tableReference: {
          catalog: database,
          schema: source.table_schema,
          table: source.table_name,
        },
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
