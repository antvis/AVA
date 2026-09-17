/**
 * Inline CSV loader: parse raw CSV content into rows, then re-serialize to a
 * temp CSV file for DuckDB to read. (For CSV files use the csv-file loader.)
 */

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';

import { removeTempFile, writeTempFile } from '../../util/file';

import { fileSource } from '../util/file';

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

export async function loadCSV(loaderOptions: CSVSourceOptions): Promise<LoadedSource> {
  const { csv, options } = loaderOptions;

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  });

  const tmpFile = await writeTempFile(toCSV(rows), 'csv');
  return fileSource(tmpFile, 'csv', () => removeTempFile(tmpFile), options);
}
