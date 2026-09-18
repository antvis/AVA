/**
 * Inline CSV loader: parse raw CSV content into rows.
 */

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

import type { CSVSourceOptions } from '../../types';

export async function loadCSV(options: CSVSourceOptions): Promise<any[]> {
  return parse(options.csv, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  });
}
