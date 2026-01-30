/**
 * CSV data loading functionality
 */

import * as fs from 'fs';

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

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
