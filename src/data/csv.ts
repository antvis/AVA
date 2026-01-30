/**
 * CSV data loading functionality
 */

import * as fs from 'fs';

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

/**
 * Load CSV file and parse it into structured data
 * @param filePath - Absolute or relative path to the CSV file
 * @returns Promise resolving to array of objects where each object represents a CSV row
 * @throws Error if file cannot be read or CSV parsing fails
 * @example
 * ```typescript
 * const data = await loadCSV('./data/companies.csv');
 * // Returns: [{ company: 'A', region: 'East', revenue: 100 }, ...]
 * ```
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
