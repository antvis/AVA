const { readFileSync } = require('node:fs');
const { parse } = require('csv-parse/sync');

const OUTPUT_COLUMNS = [
  'id', 'predicted_answer', 'sql', 'error', 'model', 'duration_ms',
  'input_tokens', 'output_tokens', 'total_tokens',
];

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** @returns {Record<string, string>[]} */
function readCsv(path) {
  return parse(readFileSync(path, 'utf8'), { bom: true, columns: true, skip_empty_lines: true });
}

module.exports = { OUTPUT_COLUMNS, csvCell, readCsv };
