/**
 * Schema helpers: map engine column types to AVA field types, extract
 * metadata from in-memory data, and stringify a Schema for LLM prompts.
 */

import type { FieldMetadata, Schema } from '../types';

/** Map DuckDB column types to AVA field types */
export function mapFieldType(columnType: string): FieldMetadata['type'] {
  const t = columnType.toUpperCase();
  if (/INT|DOUBLE|FLOAT|REAL|DECIMAL|NUMERIC/.test(t)) return 'number';
  if (/BOOL/.test(t)) return 'boolean';
  if (/DATE|TIME/.test(t)) return 'date';
  return 'string';
}

/**
 * Infer field type from sample values
 */
function inferFieldType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v != null && v !== '');

  if (nonNullValues.length === 0) return 'string';

  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => typeof v === 'number' || !Number.isNaN(Number(v)));
  if (allNumbers) return 'number';

  // Check if all values are booleans
  const allBooleans = nonNullValues.every(v =>
    typeof v === 'boolean' ||
    v === 'true' ||
    v === 'false' ||
    v === 'TRUE' ||
    v === 'FALSE'
  );
  if (allBooleans) return 'boolean';

  // Check if values look like dates
  const allDates = nonNullValues.every(v => {
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
 * Extract metadata from data
 */
export function extractDataSchema(data: any[]): Schema {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      fields: [],
    };
  }

  const fields: FieldMetadata[] = [];
  const columns = Object.keys(data[0]);

  for (const col of columns) {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(v => v != null && v !== '');
    const uniqueValues = new Set(values);

    fields.push({
      name: col,
      type: inferFieldType(values),
      samples: nonNullValues.slice(0, 5),
      uniqueCount: uniqueValues.size,
      nullCount: values.length - nonNullValues.length,
    });
  }

  return {
    rowCount: data.length,
    columnCount: columns.length,
    fields,
  };
}

/**
 * Stringify a Schema as a multi-line description for LLM context.
 * Includes row/column counts and per-field type, unique/null counts, and samples.
 */
export function stringifySchema(schema: Schema): string {
  let result = 'Dataset Info:\n';
  result += `- Rows: ${schema.rowCount}\n`;
  result += `- Columns: ${schema.columnCount}\n`;
  result += '\nFields:\n';

  for (const field of schema.fields) {
    result += `- ${field.name} (${field.rawType ?? field.type}): `;
    if (field.uniqueCount !== undefined) {
      result += `${field.uniqueCount} unique values`;
    }
    if (field.nullCount) {
      result += `, ${field.nullCount} nulls`;
    }
    if (field.samples && field.samples.length > 0) {
      result += `\n  Sample values: ${field.samples.slice(0, 3).join(', ')}`;
    }
    result += '\n';
  }

  return result;
}
