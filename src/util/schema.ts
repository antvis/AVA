/**
 * Schema helpers: assemble structural metadata and infer in-memory schemas.
 * Database queries belong to the engines; prompt formatting belongs to context.
 */

import type { Schema, TableIndex, TableRelation, TableSchema } from '../types';

/**
 * Infer field type from sample values
 */
function inferType(values: any[]): 'number' | 'string' | 'date' | 'boolean' | 'unknown' {
  const nonNullValues = values.filter((v) => v != null && v !== '');

  if (nonNullValues.length === 0) return 'string';

  if (nonNullValues.some((v) => typeof v === 'object')) return 'unknown';

  // Check if all values are booleans
  const allBooleans = nonNullValues.every(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE'
  );
  if (allBooleans) return 'boolean';

  // Check if all values are numbers
  const allNumbers = nonNullValues.every((v) => typeof v === 'number' || !Number.isNaN(Number(v)));
  if (allNumbers) return 'number';

  // Check if values look like dates
  const allDates = nonNullValues.every((v) => {
    if (typeof v === 'string') {
      const date = new Date(v);
      return !Number.isNaN(date.getTime());
    }
    return false;
  });
  if (allDates) return 'date';

  return 'string';
}

/**
 * Extract metadata from in-memory rows as a single `data` table.
 */
export function extractDataSchema(data: any[]): Schema {
  const table: TableSchema = {
    name: 'data',
    columnCount: 0,
    fields: [],
    indexes: [],
  };
  if (!data || data.length === 0) {
    return { tables: [table] };
  }

  const columns = Object.keys(data[0]);
  table.columnCount = columns.length;
  table.fields = columns.map((name) => ({
    name,
    type: inferType(data.map((row) => row[name])),
  }));
  return { tables: [table] };
}

/** Read column names from a plain index. */
function indexColumns(definition: string): string[] | undefined {
  // Capture the index key list after ON table [USING method], not parentheses in index/table names.
  const identifier = '(?:"(?:[^"]|"")*"|[^\\s"().]+)';
  const match = definition.match(
    new RegExp(`\\bON\\s+(?:ONLY\\s+)?${identifier}(?:\\.${identifier})*(?:\\s+USING\\s+\\w+)?\\s*\\((.*)`, 'i')
  );
  if (!match) return undefined;
  const columns: string[] = [];
  let rest = match[1];
  while (rest) {
    // Quoted names can contain commas/parentheses. ASC/DESC and NULLS order are not part of the name.
    const column = rest.match(
      /^\s*("(?:[^"]|"")*"|[\w$]+)(?:\s+(?:ASC|DESC))?(?:\s+NULLS\s+(?:FIRST|LAST))?\s*([,)])/i
    );
    if (!column) return undefined;
    columns.push(column[1].startsWith('"') ? column[1].slice(1, -1).replace(/""/g, '"') : column[1]);
    if (column[2] === ')') return columns;
    rest = rest.slice(column[0].length);
  }
  return undefined;
}

type Metadata = Record<string, any>;
const bool = (value: unknown): boolean => value === true || value === 1 || value === '1';

/** Build a schema from metadata rows. */
export function rowObjects2Schema(rows: Record<string, unknown>[]): Schema {
  const names = [...new Set(rows.map((row) => String(row.table_name)))].sort();
  const tables = new Map<string, TableSchema>(
    names.map((name) => [name, { name, columnCount: 0, fields: [], indexes: [] }])
  );
  const relations: TableRelation[] = [];
  const columns = new Map<string, Metadata[]>();
  const parts = new Map<string, { table: TableSchema; kind: string; rows: Metadata[] }>();
  for (const row of rows) {
    const table = tables.get(String(row.table_name));
    if (!table) continue;
    const meta: Metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    if (row.kind === 'column') {
      const fields = columns.get(table.name) ?? [];
      fields.push(meta);
      columns.set(table.name, fields);
    } else if (row.kind === 'index') {
      const indexed = meta.columns ?? indexColumns(meta.definition ?? '');
      // Skip indexes that do not contain plain columns.
      if (!indexed) continue;
      table.indexes.push({
        name: meta.name,
        columns: indexed,
        unique: bool(meta.unique),
        primary: bool(meta.primary),
      });
    } else if (row.kind === 'foreign-key') {
      relations.push({
        name: meta.name,
        kind: 'foreign-key',
        from: { table: table.name, columns: meta.columns },
        to: { table: meta.referencedTable, columns: meta.referencedColumns },
      });
    } else if (row.kind === 'index-column' || row.kind === 'foreign-key-column') {
      const key = JSON.stringify([table.name, row.kind, meta.name]);
      const group = parts.get(key) ?? { table, kind: String(row.kind), rows: [] };
      group.rows.push(meta);
      parts.set(key, group);
    }
  }
  for (const { table, kind, rows: entries } of parts.values()) {
    entries.sort((a, b) => Number(a.position) - Number(b.position));
    if (entries.some((entry, i) => !entry.column || Number(entry.position) !== i + 1)) continue;
    const first = entries[0];
    if (kind === 'index-column') {
      const index: TableIndex = {
        name: first.name,
        columns: entries.map((e) => e.column),
        unique: bool(first.unique),
        primary: bool(first.primary),
      };
      table.indexes.push(index);
    } else {
      relations.push({
        name: first.name,
        kind: 'foreign-key',
        from: { table: table.name, columns: entries.map((e) => e.column) },
        to: { table: first.referencedTable, columns: entries.map((e) => e.referencedColumn) },
      });
    }
  }
  for (const table of tables.values()) {
    table.fields = (columns.get(table.name) ?? [])
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((field) => ({ name: field.name, type: field.type, nullable: bool(field.nullable) }));
    table.columnCount = table.fields.length;
    table.indexes.sort((a, b) => a.name.localeCompare(b.name));
  }
  const exposedRelations = relations
    .filter((relation) => {
      const source = tables.get(relation.from.table);
      const target = tables.get(relation.to.table);
      const from = relation.from.columns;
      const to = relation.to.columns;
      return (
        source &&
        target &&
        Array.isArray(from) &&
        Array.isArray(to) &&
        from.length > 0 &&
        from.length === to.length &&
        from.every((name) => source.fields.some((field) => field.name === name)) &&
        to.every((name) => target.fields.some((field) => field.name === name))
      );
    })
    .sort((a, b) => a.from.table.localeCompare(b.from.table) || (a.name ?? '').localeCompare(b.name ?? ''));
  return { tables: [...tables.values()], relations: exposedRelations };
}
