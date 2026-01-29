/**
 * Data module for loading and processing data
 */

import * as fs from 'fs';

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

import type { FieldMetadata, DatasetInfo } from '../types';

/**
 * Load CSV file and parse it into structured data
 */
export async function loadCSV(filePath: string): Promise<any[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  });
  
  return records;
}

/**
 * Infer field type from sample values
 */
function inferFieldType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v != null && v !== '');
  
  if (nonNullValues.length === 0) return 'string';
  
  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => typeof v === 'number' || !isNaN(Number(v)));
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
      return !isNaN(date.getTime());
    }
    return false;
  });
  if (allDates) return 'date';
  
  return 'string';
}

/**
 * Extract metadata from data
 */
export function extractMetadata(data: any[]): DatasetInfo {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      fields: [],
      sizeInBytes: 0,
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
  
  // Estimate size in bytes
  const jsonString = JSON.stringify(data);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf-8');
  
  return {
    rowCount: data.length,
    columnCount: columns.length,
    fields,
    sizeInBytes,
  };
}

/**
 * Format dataset info as a string for LLM context
 */
export function formatDatasetInfo(info: DatasetInfo): string {
  let result = 'Dataset Info:\n';
  result += `- Rows: ${info.rowCount}\n`;
  result += `- Columns: ${info.columnCount}\n`;
  result += `- Size: ${(info.sizeInBytes / 1024).toFixed(2)} KB\n`;
  result += '\nFields:\n';
  
  for (const field of info.fields) {
    result += `- ${field.name} (${field.type}): `;
    result += `${field.uniqueCount} unique values`;
    if (field.nullCount > 0) {
      result += `, ${field.nullCount} nulls`;
    }
    if (field.samples && field.samples.length > 0) {
      result += `\n  Sample values: ${field.samples.slice(0, 3).join(', ')}`;
    }
    result += '\n';
  }
  
  return result;
}
