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
  const MAX_DISTINCT = 20;

  for (const col of columns) {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(v => v != null && v !== '');
    const type = inferFieldType(values);
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
      const nums = nonNullValues.map(Number).filter(n => !Number.isNaN(n));
      field.min = Math.min(...nums);
      field.max = Math.max(...nums);
    } else {
      // date: epoch milliseconds
      const ts = nonNullValues.map(v => new Date(v).getTime()).filter(t => !Number.isNaN(t));
      field.min = Math.min(...ts);
      field.max = Math.max(...ts);
    }

    fields.push(field);
  }

  return {
    rowCount: data.length,
    columnCount: columns.length,
    fields,
  };
}

/**
 * Stringify a Schema as a multi-line description for LLM context.
 * Categorical fields list distinct values; numeric/temporal fields show min/max.
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
    if (field.min !== undefined && field.min !== null) {
      result += `min ${field.min}, max ${field.max}`;
    }
    if (field.nullCount) {
      result += `, ${field.nullCount} nulls`;
    }
    if (field.samples && field.samples.length > 0) {
      result += `\n  Values: ${field.samples.join(', ')}`;
    }
    result += '\n';
  }

  return result;
}
