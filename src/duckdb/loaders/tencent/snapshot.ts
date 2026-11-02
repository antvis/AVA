import { TencentDocsError } from './client';
import { convertRecord } from './convert';

import type { TencentCell, TencentField } from './convert';

const MAX_EXPANDED_BYTES = 16 * 1024 * 1024;
const MAX_EXPANDED_CELLS = 1000000;

/** Bound both serialized data and dense-object overhead, not just sparse MCP bytes. */
export function createSnapshotBuilder(
  fields: TencentField[],
  limits = { maxBytes: MAX_EXPANDED_BYTES, maxCells: MAX_EXPANDED_CELLS }
) {
  const rows: Record<string, TencentCell>[] = [];
  const columns = fields.length + 1; // Include the source _record_id column.
  const maxRecords = Math.floor(limits.maxCells / columns);
  let bytes = 2; // JSON array brackets; commas are counted before each later row.
  return {
    rows,
    maxRecords,
    append(record: unknown): void {
      // Check before allocating a dense row, including missing/null cells.
      if (rows.length >= maxRecords) {
        throw new TencentDocsError(`Expanded snapshot exceeds the ${limits.maxCells}-cell read limit.`);
      }
      const row = convertRecord(fields, record);
      const nextBytes = bytes + (rows.length ? 1 : 0) + Buffer.byteLength(JSON.stringify(row), 'utf8');
      if (nextBytes > limits.maxBytes) {
        throw new TencentDocsError(`Expanded snapshot exceeds the ${limits.maxBytes}-byte read limit.`);
      }
      // Retain only rows whose expanded representation is within both budgets.
      rows.push(row);
      bytes = nextBytes;
    },
  };
}
