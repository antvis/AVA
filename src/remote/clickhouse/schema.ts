import type { Schema } from '../../types';

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  table_name: string;
  name: string;
  type: string;
  nullable?: number | boolean | string;
  position?: number | string;
}

function bool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

export async function getClickHouseSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  database: string
): Promise<Schema> {
  const tables = (await runQuery(`
    SELECT
      name AS table_name
    FROM system.tables
    WHERE database = '${database.replace(/'/g, "''")}' AND is_temporary = 0
    ORDER BY table_name
  `)) as unknown as TableRow[];

  if (tables.length === 0) return { models: [], relationships: [] };

  const columns = (await runQuery(`
    SELECT
      table AS table_name,
      name,
      type,
      startsWith(type, 'Nullable(') AS nullable,
      position
    FROM system.columns
    WHERE database = '${database.replace(/'/g, "''")}'
    ORDER BY table_name, position
  `)) as unknown as ColumnRow[];

  return {
    models: tables.map((source) => {
      const fields = columns
        .filter(({ table_name }) => table_name === source.table_name)
        .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
        .map((column) => ({ name: column.name, type: column.type, notNull: !bool(column.nullable) }));
      return {
        name: source.table_name,
        tableReference: { catalog: database, table: source.table_name },
        columns: fields,
      };
    }),
    relationships: [],
  };
}
