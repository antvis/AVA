/**
 * BigQuery schema discovery through dataset-scoped BigQuery INFORMATION_SCHEMA
 * views. The queries are deliberately flat (no JOINs) so they run on both the
 * `@google-cloud/bigquery` adapter and the built-in mock connector; each returns
 * regular rows that the engine assembles into a Schema.
 *
 * REFERENCES:
 *   https://cloud.google.com/bigquery/docs/information-schema-tables
 *   https://cloud.google.com/bigquery/docs/information-schema-columns
 *   https://cloud.google.com/bigquery/docs/information-schema-key-column-usage
 *   https://cloud.google.com/bigquery/docs/information-schema-table-constraints
 */
import type { Schema } from '../../types';

interface TableRow {
  table_catalog?: string;
  table_schema?: string;
  table_name: string;
}

interface ColumnRow {
  table_catalog?: string;
  table_schema?: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface KeyRow {
  table_name: string;
  column_name: string;
  constraint_name: string;
  ordinal_position: number;
}

interface ConstraintRow {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
}

function bool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'YES' || value === 'yes';
}

/** Escape a value for a SQL backquoted BigQuery identifier (doubles the backtick). */
function identifier(value: string): string {
  return `\`${value.replace(/`/g, '``')}\``;
}

export async function getBigQuerySchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  dataset: string,
  project: string
): Promise<Schema> {
  const ds = identifier(dataset);
  const columnsProjection = 'table_catalog, table_schema, table_name, column_name, ordinal_position, is_nullable, data_type';

  const tables = (await runQuery(
    `SELECT table_catalog, table_schema, table_name\nFROM ${ds}.INFORMATION_SCHEMA.TABLES\nWHERE table_type = 'BASE TABLE'\nORDER BY table_name`
  )) as unknown as TableRow[];

  if (tables.length === 0) return { models: [], relationships: [] };

  const [columnRows, keyRows, constraintRows] = await Promise.all([
    runQuery(`SELECT ${columnsProjection}\nFROM ${ds}.INFORMATION_SCHEMA.COLUMNS\nORDER BY table_name, ordinal_position`) as Promise<unknown>,
    runQuery(`SELECT table_name, column_name, constraint_name, ordinal_position\nFROM ${ds}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE\nORDER BY table_name, ordinal_position`) as Promise<unknown>,
    runQuery(`SELECT table_name, constraint_name, constraint_type\nFROM ${ds}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS\nORDER BY table_name, constraint_name`) as Promise<unknown>,
  ]);

  const columnData = columnRows as unknown as ColumnRow[];
  const keyData = keyRows as unknown as KeyRow[];
  const primaryConstraints = new Set(
    (constraintRows as unknown as ConstraintRow[])
      .filter((constraint) => constraint.constraint_type === 'PRIMARY KEY')
      .map((constraint) => `${constraint.table_name}\u0000${constraint.constraint_name}`)
  );

  return {
    models: tables.map(({ table_catalog, table_schema, table_name }) => {
      // Dataset-scoped INFORMATION_SCHEMA rows carry project / dataset / table
      // separately; prefer each table's reported values over the config.
      const catalog = table_catalog ?? project;
      const schema = table_schema ?? dataset;
      const fields = columnData
        .filter(
          (column) =>
            column.table_name === table_name &&
            (column.table_catalog ?? catalog) === catalog &&
            (column.table_schema ?? schema) === schema
        )
        .map((column) => ({
          name: column.column_name,
          type: column.data_type,
          notNull: !bool(column.is_nullable),
        }));

      const primaryColumns = keyData
        .filter(
          (key) =>
            key.table_name === table_name && primaryConstraints.has(`${key.table_name}\u0000${key.constraint_name}`)
        )
        .sort((a, b) => Number(a.ordinal_position) - Number(b.ordinal_position))
        .map((key) => key.column_name);

      return {
        name: table_name,
        tableReference: { catalog, schema, table: table_name },
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