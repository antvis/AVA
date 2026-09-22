/**
 * Schema helpers: extract metadata from in-memory data and stringify a Schema
 * for LLM prompts.
 */

import type { Schema, TableIndex, TableSchema } from '../types';

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
  const MAX_DISTINCT = 20;

  for (const col of columns) {
    const values = data.map((row) => row[col]);
    const nonNullValues = values.filter((v) => v != null && v !== '');
    const type = inferType(values);
    const field: FieldMetadata = {
      name: col,
      type,
      nullCount: values.length - nonNullValues.length,
    };

    if (type === 'string' || type === 'boolean') {
      const distinct = [...new Set(nonNullValues)];
      field.uniqueCount = distinct.length;
      field.samples = distinct.slice(0, MAX_DISTINCT);
    } else if (type === 'number') {
      const nums = nonNullValues.map(Number).filter((n) => !Number.isNaN(n));
      field.min = Math.min(...nums);
      field.max = Math.max(...nums);
    } else {
      // date: epoch milliseconds
      const ts = nonNullValues.map((v) => new Date(v).getTime()).filter((t) => !Number.isNaN(t));
      field.min = Math.min(...ts);
      field.max = Math.max(...ts);
    }

    fields.push(field);
  }

  table.rowCount = data.length;
  table.columnCount = columns.length;
  table.fields = fields;
  return { tables: [table] };
}

/**
 * Stringify a table's indexes for LLM context.
 */
function stringifyIndexes(indexes: TableIndex[], formatIdentifier?: (name: string) => string): string {
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
 * and JOIN them. Categorical fields list distinct values; numeric/temporal
 * fields show min/max.
 */
export function stringifySchema(schema: Schema, formatIdentifier?: (name: string) => string): string {
  let result = `Dataset Info: ${schema.tables.length} table(s)\n`;

  for (const table of schema.tables) {
    result += `\nTable ${formatIdentifier ? formatIdentifier(table.name) : `"${table.name}"`}:\n`;
    result += `- Rows: ${table.rowCount}\n`;
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

  return result;
}
