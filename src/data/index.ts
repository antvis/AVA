/**
 * Data module for loading and processing data
 */

import type { FieldMetadata, DatasetInfo } from '../types';

// Re-export data loading functions from individual modules
export { loadCSV } from './csv';
export { loadObject } from './json';
export { loadURL } from './url';
export { loadText } from './text';

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

  // Estimate size in bytes (works in both Node.js and browser)
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new TextEncoder().encode(jsonString).length;

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

/**
 * Generate a human-readable data description for LLM context.
 * Supports arrays, objects (e.g. {labels, datasets}), strings, and primitives.
 * Unlike extractMetadata which requires flat object arrays, this handles any data format.
 */
export function describeData(data: unknown): string {
  // Array of flat objects — use the existing metadata pipeline
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    try {
      const metadata = extractMetadata(data as any[]);
      return formatDatasetInfo(metadata);
    } catch {
      // Fallback to raw description if metadata extraction fails
    }
  }

  // Array of primitives
  if (Array.isArray(data)) {
    if (data.length === 0) return 'Dataset Info:\n- Empty dataset (0 rows)';
    const sample = data.slice(0, 5).map(v => JSON.stringify(v)).join(', ');
    return `Dataset Info:\n- Type: array of ${typeof data[0]}\n- Length: ${data.length}\n- Sample: ${sample}`;
  }

  // Object: { labels, datasets } pattern
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.labels) && Array.isArray(obj.datasets)) {
      const datasetSummaries = (obj.datasets as Array<Record<string, unknown>>).map((ds, i) => {
        const label = typeof ds.label === 'string' ? ds.label : `series-${i + 1}`;
        const len = Array.isArray(ds.data) ? ds.data.length : 0;
        const sample = Array.isArray(ds.data) ? ds.data.slice(0, 3).join(', ') : '';
        return `  - ${label}: [${len} values]${sample ? ` sample: ${sample}` : ''}`;
      });
      return [
        'Dataset Info:',
        '- Type: chart data with labels and datasets',
        `- Labels (${(obj.labels as unknown[]).length}): ${(obj.labels as unknown[]).slice(0, 5).join(', ')}`,
        '- Datasets:',
        ...datasetSummaries,
      ].join('\n');
    }

    // Generic object — describe keys and types
    const keys = Object.keys(obj);
    const fieldDescs = keys.map(k => {
      const v = obj[k];
      const type = Array.isArray(v) ? `array[${v.length}]` : typeof v;
      const sample = typeof v === 'string' ? `"${v.slice(0, 30)}"` : JSON.stringify(v)?.slice(0, 50);
      return `  - ${k} (${type}): ${sample}`;
    });
    return [
      'Dataset Info:',
      '- Type: object',
      `- Fields (${keys.length}):`,
      ...fieldDescs,
    ].join('\n');
  }

  // String
  if (typeof data === 'string') {
    return [
      'Dataset Info:',
      '- Type: string',
      `- Length: ${data.length} characters`,
      `- Preview: ${data}`,
    ].join('\n');
  }

  // Fallback for number, boolean, null, undefined
  return `Dataset Info:\n- Type: ${data === null ? 'null' : typeof data}\n- Value: ${String(data)}`;
}
