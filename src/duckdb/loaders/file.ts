/**
 * File loaders: csv-file / json / parquet.
 * A local file path is used directly; a remote URL is downloaded to a temp file first.
 */

import { downloadToTempFile, removeTempFile } from '../../util/file';

import type { FileFormat, FileSourceOptions, LoadedSource } from '../../types';

const noopCleanup = async (): Promise<void> => {};

function createFileLoader(format: FileFormat) {
  return async (options: FileSourceOptions): Promise<LoadedSource> => {
    const { path: sourcePath, headers } = options;

    if (!/^https?:\/\//.test(sourcePath)) {
      // Local file — DuckDB reads it in place
      return { path: sourcePath, format, cleanup: noopCleanup };
    }

    // Remote file — download to a temp file (DuckDB stays offline)
    const tmpFile = await downloadToTempFile(sourcePath, format, headers);
    return { path: tmpFile, format, cleanup: () => removeTempFile(tmpFile) };
  };
}

export const loadCSVFile = createFileLoader('csv');
export const loadJSONFile = createFileLoader('json');
export const loadParquetFile = createFileLoader('parquet');
