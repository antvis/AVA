/**
 * Parquet file loader: read a Parquet file (local path or http(s) URL) through
 * DuckDB's parquet reader.
 */

import { createFileLoader } from '../util/file';

import type { ParquetSourceOptions } from '../../contracts';

export const loadParquetFile = createFileLoader<ParquetSourceOptions>('parquet');
