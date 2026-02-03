/**
 * CSV data loading functionality
 */

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

/**
 * Load CSV file and parse it into structured data
 * @param filePathOrContent - In Node.js: path to CSV file. In browser: CSV content string
 * @returns Promise resolving to array of objects where each object represents a CSV row
 * @throws Error if file cannot be read or CSV parsing fails
 * @example
 * ```typescript
 * // Node.js
 * const data = await loadCSV('./data/companies.csv');
 * 
 * // Browser
 * const file = document.querySelector('input[type="file"]').files[0];
 * const content = await file.text();
 * const data = await loadCSV(content);
 * // Returns: [{ company: 'A', region: 'East', revenue: 100 }, ...]
 * ```
 */
export async function loadCSV(filePathOrContent: string): Promise<any[]> {
  let content: string;
  
  // Check if running in Node.js environment and input looks like a file path
  if (typeof process !== 'undefined' && process.versions?.node && !filePathOrContent.includes('\n') && !filePathOrContent.includes(',')) {
    // Node.js: read from file system
    const fs = await import('fs');
    content = fs.readFileSync(filePathOrContent, 'utf-8');
  } else {
    // Browser or content string: use as-is
    content = filePathOrContent;
  }
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  });
  
  return records;
}
