/**
 * CSV file loader: read a CSV file (local path or http(s) URL) through
 * DuckDB's csv reader. Distinct from the inline `csv` loader (csv.ts), which
 * accepts CSV content as a string.
 */

import { createFileLoader } from '../util/file';

import type { CSVFileSourceOptions } from '../../types';

export const loadCSVFile = createFileLoader<CSVFileSourceOptions>('csv');
