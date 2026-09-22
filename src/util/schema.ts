/**
 * Schema helpers: assemble structural metadata, infer in-memory schemas, and
 * format schemas for LLM prompts. Database queries belong to the engines.
 */

import type { FieldMetadata, Schema, TableIndex, TableRelationship, TableSchema } from '../types';

/**
 * Infer field type from sample values
 */
function inferType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  const nonNullValues = values.filter((v) => v != null && v !== '');

  if (nonNullValues.length === 0) return 'string';

  // Check if all values are numbers
  const allNumbers = nonNullValues.every((v) => typeof v === 'number' || !Number.isNaN(Number(v)));
  if (allNumbers) return 'number';

  // Check if all values are booleans
  const allBooleans = nonNullValues.every(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE'
  );
  if (allBooleans) return 'boolean';

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
    rowCount: 0,
    columnCount: 0,
    fields: [],
    indexes: [],
  };
  if (!data || data.length === 0) {
    return { tables: [table] };
  }

  const fields: FieldMetadata[] = [];
  const columns = Object.keys(data[0]);

  for (const col of columns) {
    const values = data.map((row) => row[col]);
    fields.push({ name: col, type: inferType(values) });
  }

  table.rowCount = data.length;
  table.columnCount = columns.length;
  table.fields = fields;
  return { tables: [table] };
}

/**
 * Stringify a table's indexes for LLM context.
 */
function stringifyIndexes(
  indexes: TableIndex[],
  formatIdentifier?: (name: string) => string
): string {
  if (indexes.length === 0) return '';

  let result = 'Indexes:\n';
  for (const index of indexes) {
    const tag = index.primary ? 'PRIMARY KEY' : index.unique ? 'UNIQUE' : '';
    const prefix = tag ? `${tag} ` : '';
    const columns = index.columns.map((col) => formatIdentifier?.(col) ?? col).join(', ');
    const name = formatIdentifier?.(index.name) ?? index.name;
    result += `  - ${prefix}${name} (${columns})\n`;
  }
  return result;
}

/**
 * Stringify a Schema as a multi-line description for LLM context.
 * Each table is described with its name and fields so the LLM can reference
 * and JOIN them. Include known row counts, nullability and indexes without
 * computing data statistics.
 */
export function stringifySchema(
  schema: Schema,
  formatIdentifier?: (name: string) => string
): string {
  let result = `Dataset Info: ${schema.tables.length} table(s)\n`;

  for (const table of schema.tables) {
    result += `\nTable ${formatIdentifier ? formatIdentifier(table.name) : `"${table.name}"`}:\n`;
    if (table.rowCount !== undefined) {
      result += `- Rows: ${table.rowCount}\n`;
    }
    result += `- Columns: ${table.columnCount}\n`;
    result += 'Fields:\n';

    for (const field of table.fields) {
      const nullable = field.nullable === false ? ' NOT NULL' : '';
      result += `- ${formatIdentifier?.(field.name) ?? field.name} (${field.type})${nullable}\n`;
    }

    if (table.indexes.length > 0) {
      result += stringifyIndexes(table.indexes, formatIdentifier);
    }
  }

  if (schema.relationships?.length) {
    const identifier = formatIdentifier ?? ((name: string) => name);
    result += '\nRelationships (declared; pair columns by position):\n';
    for (const relationship of schema.relationships) {
      const source = schema.tables.find((table) => table.name === relationship.from?.table);
      const target = schema.tables.find((table) => table.name === relationship.to?.table);
      const from = relationship.from?.columns;
      const to = relationship.to?.columns;
      if (
        !source ||
        !target ||
        !Array.isArray(from) ||
        !Array.isArray(to) ||
        !from.length ||
        from.length !== to.length ||
        relationship.kind !== 'foreign-key' ||
        new Set(from).size !== from.length ||
        new Set(to).size !== to.length ||
        from.some((column) => !source.fields.some((field) => field.name === column)) ||
        to.some((column) => !target.fields.some((field) => field.name === column))
      ) {
        throw new Error(`Invalid relationship ${relationship.name ?? '(unnamed)'}`);
      }
      const label = relationship.name ? `${identifier(relationship.name)}: ` : '';
      result += `  - [${relationship.kind}] ${label}${identifier(source.name)} (${from
        .map(identifier)
        .join(', ')}) REFERENCES ${identifier(target.name)} (${to.map(identifier).join(', ')})\n`;
    }
  }

  return result;
}

/** Parse plain column indexes only; never misrepresent expressions as column identifiers. */
function indexColumns(definition: string): string[] | undefined {
  // Capture the index key list after ON table [USING method], not parentheses in index/table names.
  const identifier = '(?:"(?:[^"]|"")*"|[^\\s"().]+)';
  const match = definition.match(
    new RegExp(
      `\\bON\\s+(?:ONLY\\s+)?${identifier}(?:\\.${identifier})*(?:\\s+USING\\s+\\w+)?\\s*\\((.*)`,
      'i'
    )
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
    columns.push(
      column[1].startsWith('"') ? column[1].slice(1, -1).replace(/""/g, '"') : column[1]
    );
    if (column[2] === ')') return columns;
    rest = rest.slice(column[0].length);
  }
  return undefined;
}

type Metadata = Record<string, any>;
const bool = (value: unknown): boolean => value === true || value === 1 || value === '1';

/** Assemble in one place; only publish relationships between tables actually exposed to queries. */
export function rowObjects2Schema(rows: Record<string, unknown>[]): Schema {
  const names = [...new Set(rows.map((row) => String(row.table_name)))].sort();
  const tables = new Map<string, TableSchema>(
    names.map((name) => [name, { name, columnCount: 0, fields: [], indexes: [] }])
  );
  const relationships: TableRelationship[] = [];
  const columns = new Map<string, Metadata[]>();
  const parts = new Map<string, { table: TableSchema; kind: string; rows: Metadata[] }>();
  for (const row of rows) {
    const table = tables.get(String(row.table_name));
    if (!table) continue;
    const meta: Metadata =
      typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    if (row.kind === 'column') {
      const fields = columns.get(table.name) ?? [];
      fields.push(meta);
      columns.set(table.name, fields);
    } else if (row.kind === 'index') {
      const indexed = meta.columns ?? indexColumns(meta.definition ?? '');
      // Expression indexes cannot be faithfully represented by TableIndex.columns.
      if (!indexed) continue;
      table.indexes.push({
        name: meta.name,
        columns: indexed,
        unique: bool(meta.unique),
        primary: bool(meta.primary),
      });
    } else if (row.kind === 'foreign-key') {
      relationships.push({
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
      relationships.push({
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
  const exposedRelationships = relationships
    .filter((relationship) => {
      const source = tables.get(relationship.from.table);
      const target = tables.get(relationship.to.table);
      const from = relationship.from.columns;
      const to = relationship.to.columns;
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
    .sort(
      (a, b) =>
        a.from.table.localeCompare(b.from.table) || (a.name ?? '').localeCompare(b.name ?? '')
    );
  return { tables: [...tables.values()], relationships: exposedRelationships };
}
