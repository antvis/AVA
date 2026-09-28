const OUTPUT_COLUMNS = [
  'id', 'predicted_answer', 'sql', 'error', 'model', 'duration_ms',
  'input_tokens', 'output_tokens', 'total_tokens',
];

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

module.exports = { OUTPUT_COLUMNS, csvCell };
