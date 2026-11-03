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
  table_name: string;
}

interface ColumnRow {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface KeyRow {
  table_name: string;
  column_name: string;
  ordinal_position: number;
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
  dataset: string
): Promise<Schema> {
  const ds = identifier(dataset);
  const columnsProjection = 'table_catalog, table_schema, table_name, column_name, ordinal_position, is_nullable, data_type';

  const tables = (await runQuery(`SELECT table_name\nFROM ${ds}.INFORMATION_SCHEMA.TABLES\nWHERE table_type = 'BASE TABLE'\nORDER BY table_name`)) as unknown as TableRow[];

  if (tables.length === 0) return { models: [], relationships: [] };

  const [columnRows, keyRows] = await Promise.all([
    runQuery(`SELECT ${columnsProjection}\nFROM ${ds}.INFORMATION_SCHEMA.COLUMNS\nORDER BY table_name, ordinal_position`) as Promise<unknown>,
    runQuery(`SELECT table_name, column_name, ordinal_position\nFROM ${ds}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE\nORDER BY table_name, ordinal_position`) as Promise<unknown>,
  ]);

  const columnData = columnRows as unknown as ColumnRow[];
  const keyData = keyRows as unknown as KeyRow[];

  return {
    models: tables.map(({ table_name }) => {
      const fields = columnData
        .filter((column) => column.table_name === table_name)
        .map((column) => ({
          name: column.column_name,
          type: column.data_type,
          notNull: !bool(column.is_nullable),
        }));

      const primaryColumns = keyData
        .filter((key) => key.table_name === table_name)
        .sort((a, b) => Number(a.ordinal_position) - Number(b.ordinal_position))
        .map((key) => key.column_name);

      return {
        name: table_name,
        tableReference: { catalog: dataset, table: table_name },
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