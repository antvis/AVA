/**
 * Shared file-source helpers for the file-based loaders (csv-file, json-file,
 * parquet). A local file path is used directly; a remote URL is downloaded to
 * a temp file first. This module only holds utilities — each concrete loader
 * lives in its own file.
 */

import { dirname } from 'node:path';

import { downloadToTempFile, removeTempFile } from '../../util/file';
import { READ_FN, escapeSql, serializeOptions } from '../../util/sql';

import type { CSVReadOptions, FileFormat, LoadedSource } from '../../types';

const noopCleanup = async (): Promise<void> => {};

/**
 * Build a LoadedSource that registers a local file as the single `data` view.
 * The view reads the file lazily, so the file must outlive the engine.
 * The file's directory is whitelisted so the engine can still read it after hardening.
 * `options` carries extra DuckDB reader options (only applied to the csv reader).
 */
export function fileSource(
  path: string,
  format: FileFormat,
  cleanup: () => Promise<void>,
  options?: CSVReadOptions
): LoadedSource {
  return {
    register: async (conn) => {
      // csv/json default to auto_detect=true; for csv a user-supplied auto_detect
      // overrides it because DuckDB applies later duplicate options over earlier ones.
      const sniff =
        format === 'parquet' ? '' : `, auto_detect=true${format === 'csv' ? serializeOptions(options) : ''}`;
      await conn.run(
        `CREATE OR REPLACE VIEW data AS SELECT * FROM ${READ_FN[format]}('${escapeSql(path)}'${sniff})`
      );
      return ['data'];
    },
    allowedDirectories: [dirname(path)],
    cleanup,
  };
}

/**
 * Structural shape shared by every file-source options type
 * (CSVFileSourceOptions / JsonFileSourceOptions / ParquetSourceOptions).
 * Each loader declares its own options interface; this constraint lets them
 * reuse one implementation while keeping their types distinct.
 */
export interface FileLoaderOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
  /** Extra DuckDB reader options (only applied to the csv reader) */
  options?: CSVReadOptions;
}

/**
 * Build a file loader for a DuckDB-readable format: local files are read in
 * place, remote URLs are downloaded to a temp file first.
 */
export function createFileLoader<T extends FileLoaderOptions>(format: FileFormat) {
  return async (loaderOptions: T): Promise<LoadedSource> => {
    const { path: sourcePath, headers, options } = loaderOptions;

    if (!/^https?:\/\//.test(sourcePath)) {
      // Local file — DuckDB reads it in place
      return fileSource(sourcePath, format, noopCleanup, options);
    }

    // Remote file — download to a temp file (DuckDB stays offline)
    const tmpFile = await downloadToTempFile(sourcePath, format, headers);
    return fileSource(tmpFile, format, () => removeTempFile(tmpFile), options);
  };
}
