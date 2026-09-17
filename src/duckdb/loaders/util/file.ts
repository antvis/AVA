/**
 * Shared file-source helpers for the file-based loaders (csv-file, json-file,
 * parquet). A local file path is used directly; a remote URL is downloaded to
 * a temp file first. This module only holds utilities — each concrete loader
 * lives in its own file.
 */

import { dirname } from 'node:path';

import { downloadToTempFile, removeTempFile } from '../../../util/file';
import { READ_FN, escapeSql } from '../../../util/sql';

import type { FileFormat, LoadedSource } from '../../../types';

const noopCleanup = async (): Promise<void> => {};

/**
 * Build a LoadedSource that registers a local file as the single `data` view.
 * The view reads the file lazily, so the file must outlive the engine.
 * The file's directory is whitelisted so the engine can still read it after hardening.
 */
export function fileSource(
  path: string,
  format: FileFormat,
  cleanup: () => Promise<void>
): LoadedSource {
  return {
    register: async (conn) => {
      const sniff = format === 'parquet' ? '' : ', auto_detect=true';
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
}

/**
 * Build a file loader for a DuckDB-readable format: local files are read in
 * place, remote URLs are downloaded to a temp file first.
 */
export function createFileLoader<T extends FileLoaderOptions>(format: FileFormat) {
  return async (options: T): Promise<LoadedSource> => {
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
