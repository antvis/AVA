import type { Schema, TableIndex } from '../../types';

interface TableRow {
  table_name: string;
  engine?: string;
  primary_key?: string;
  sorting_key?: string;
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

function splitExpressionList(expression: string): string[] | undefined {
  const values: string[] = [];
  let current = '';
  let depth = 0;
  let quote: '"' | '`' | null = null;
  for (let i = 0; i < expression.length; i += 1) {
    const ch = expression[i];
    if (quote) {
      current += ch;
      if (ch === quote) {
        if (quote === '"' && expression[i + 1] === '"') {
          current += expression[i + 1];
          i += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }
    if (ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (quote || depth !== 0) return undefined;
  if (current.trim()) values.push(current.trim());
  return values;
}

function parseIdentifier(token: string): string | undefined {
  const value = token.trim();
  if (!value) return undefined;
  if (value.startsWith('`') && value.endsWith('`')) return value.slice(1, -1);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replace(/""/g, '"');
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) ? value : undefined;
}

function parseKeyColumns(expression?: string): string[] | undefined {
  if (!expression) return undefined;
  let source = expression.trim();
  if (!source || source === 'tuple()') return undefined;
  if (/^tuple\(/i.test(source) && source.endsWith(')')) source = source.slice(6, -1);
  else if (source.startsWith('(') && source.endsWith(')')) source = source.slice(1, -1);
  const entries = splitExpressionList(source);
  if (!entries?.length) return undefined;
  const columns = entries.map(parseIdentifier);
  return columns.every((name): name is string => !!name) ? columns : undefined;
}

function pushIndex(indexes: TableIndex[], index: TableIndex | null): void {
  if (!index) return;
  const existing = indexes.find(({ columns }) => columns.join('\0') === index.columns.join('\0'));
  if (!existing) {
    indexes.push(index);
    return;
  }
  if (index.primary && !existing.primary) {
    existing.name = index.name;
    existing.primary = true;
  }
}

function makeIndex(name: string, expression: string | undefined, primary: boolean): TableIndex | null {
  const columns = parseKeyColumns(expression);
  return columns?.length ? { name, columns, unique: false, primary } : null;
}

export async function getClickHouseSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  database: string
): Promise<Schema> {
  const tables = (await runQuery(`
    SELECT
      name AS table_name,
      engine,
      primary_key,
      sorting_key
    FROM system.tables
    WHERE database = '${database.replace(/'/g, "''")}' AND is_temporary = 0
    ORDER BY table_name
  `)) as unknown as TableRow[];

  if (tables.length === 0) return { tables: [], relations: [] };

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
    tables: tables.map((source) => {
      const indexes: TableIndex[] = [];
      pushIndex(indexes, makeIndex('primary_key', source.primary_key, true));
      pushIndex(indexes, makeIndex('sorting_key', source.sorting_key, false));
      const fields = columns
        .filter(({ table_name }) => table_name === source.table_name)
        .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
        .map((column) => ({ name: column.name, type: column.type, nullable: bool(column.nullable) }));
      return {
        name: source.table_name,
        columnCount: fields.length,
        fields,
        indexes: indexes.sort((a, b) => a.name.localeCompare(b.name)),
      };
    }),
    relations: [],
  };
}
