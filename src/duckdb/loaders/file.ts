/**
 * File loaders: csv-file / json / parquet.
 * A local file path is used directly; a remote URL is downloaded to a temp file first.
 */

import { dirname } from 'node:path';

import { downloadToTempFile, removeTempFile } from '../../util/file';
import { READ_FN, escapeSql } from '../../util/sql';

import type { FileFormat, FileSourceOptions, LoadedSource } from '../../types';

const noopCleanup = async (): Promise<void> => {};

/**
 * Build a LoadedSource that registers a local file as the data view.
 * The view reads the file lazily, so the file must outlive the engine.
 * The file's directory is whitelisted so the engine can still read it after hardening.
 */
export function fileSource(
  path: string,
  format: FileFormat,
  cleanup: () => Promise<void>
): LoadedSource {
  return {
    register: async (conn, tableName) => {
      const sniff = format === 'parquet' ? '' : ', auto_detect=true';
      await conn.run(
        `CREATE OR REPLACE VIEW ${tableName} AS SELECT * FROM ${READ_FN[format]}('${escapeSql(path)}'${sniff})`
      );
    },
    allowedDirectories: [dirname(path)],
    cleanup,
  };
}

function createFileLoader(format: FileFormat) {
  return async (options: FileSourceOptions): Promise<LoadedSource> => {
    const { path: sourcePath, headers } = options;

    if (!/^https?:\/\//.test(sourcePath)) {
      // Local file — DuckDB reads it in place
      return fileSource(sourcePath, format, noopCleanup);
    }

    // Remote file — download to a temp file (DuckDB stays offline)
    const tmpFile = await downloadToTempFile(sourcePath, format, headers);
    return fileSource(tmpFile, format, () => removeTempFile(tmpFile));
  };
}

export const loadCSVFile = createFileLoader('csv');
export const loadJSONFile = createFileLoader('json');
export const loadParquetFile = createFileLoader('parquet');
