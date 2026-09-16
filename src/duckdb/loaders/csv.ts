/**
 * Inline CSV loader: parse CSV content (or a Node.js file path) into rows,
 * then re-serialize to a temp CSV file for DuckDB to read.
 */

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

import { removeTempFile, writeTempFile } from '../../util/file';

import type { CSVSourceOptions, LoadedSource } from '../../types';

/**
 * Serialize rows back to a CSV string with a header line.
 */
function toCSV(rows: any[]): string {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0]);
  const escape = (value: any): string => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(','));
  }
  return lines.join('\n');
}

export async function loadCSV(options: CSVSourceOptions): Promise<LoadedSource> {
  const { pathOrContent } = options;
  let content: string;

  // In Node.js, a value that looks like a file path is read from disk;
  // otherwise the value is treated as raw CSV content.
  const looksLikeFilePath = /^(\.\/|\.\.\/|\/|[a-zA-Z]:[\\/]|\\\\)/.test(pathOrContent);
  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node && looksLikeFilePath) {
    const fs = await import('fs/promises');
    content = await fs.readFile(pathOrContent, 'utf-8');
  } else {
    content = pathOrContent;
  }

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  });

  const tmpFile = await writeTempFile(toCSV(rows), 'csv');
  return { path: tmpFile, format: 'csv', cleanup: () => removeTempFile(tmpFile) };
}
