import { NotionError } from './client';
import { convertPage } from './convert';

import type { NotionCell, NotionField } from './convert';

const MAX_EXPANDED_BYTES = 16 * 1024 * 1024;
const MAX_EXPANDED_CELLS = 1000000;

/**
 * Bound both serialized data and dense-object overhead rather than only the
 * sparse API response bytes. Converts one page at a time; never retains the
 * whole raw response array.
 */
export function createSnapshotBuilder(
  fields: NotionField[],
  limits = { maxBytes: MAX_EXPANDED_BYTES, maxCells: MAX_EXPANDED_CELLS }
) {
  const rows: Record<string, NotionCell>[] = [];
  const columns = fields.length + 1; // Include the source _id column.
  const maxRecords = Math.floor(limits.maxCells / columns);
  let bytes = 2; // JSON array brackets; commas counted before each later row.
  return {
    rows,
    maxRecords,
    append(page: unknown): void {
      if (rows.length >= maxRecords) {
        throw new NotionError(`Expanded snapshot exceeds the ${limits.maxCells}-cell read limit.`);
      }
      const row = convertPage(fields, page);
      const nextBytes = bytes + (rows.length ? 1 : 0) + Buffer.byteLength(JSON.stringify(row), 'utf8');
      if (nextBytes > limits.maxBytes) {
        throw new NotionError(`Expanded snapshot exceeds the ${limits.maxBytes}-byte read limit.`);
      }
      rows.push(row);
      bytes = nextBytes;
    },
  };
}