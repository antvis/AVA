/**
 * CSV file loader: read a CSV file (local path or http(s) URL) through
 * DuckDB's csv reader. Distinct from the inline `csv` loader (csv.ts), which
 * parses CSV content in JS first.
 */

import { createFileLoader } from './util/file';

import type { CSVFileSourceOptions } from '../../types';

export const loadCSVFile = createFileLoader<CSVFileSourceOptions>('csv');
