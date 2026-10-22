import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

const OUTPUT_COLUMNS = [
  'id', 'predicted_answer', 'sql', 'error', 'model', 'duration_ms',
  'input_tokens', 'output_tokens', 'total_tokens',
];

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function csvRows(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function previewCsv({ schema, data }) {
  const columns = schema.map((column) => column.name);
  const rows = [columns, ...data.map((row) => columns.map((column) => {
    const value = row[column];
    return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
  }))];
  return csvRows(rows);
}

/** @returns {Record<string, string>[]} */
function readCsv(path) {
  return parse(readFileSync(path, 'utf8'), { bom: true, columns: true, skip_empty_lines: true });
}

export { OUTPUT_COLUMNS, csvCell, csvRows, previewCsv, readCsv };
