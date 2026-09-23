/**
 * File helpers for the DuckDB engine: temp file creation, remote download,
 * cleanup, and the shared file-source helpers used by the file-based loaders
 * (csv-file, json-file, parquet). A local file path is used directly; a remote
 * URL is downloaded to a temp file first. Node.js only.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { dirname, join } from 'node:path';

import { READ_FN, escapeSql, serializeOptions } from '../../util/sql';

import { getDuckDBSchema } from './schema';

import type { CSVReadOptions, FileFormat, LoadedSource } from '../../types';

const noopCleanup = async (): Promise<void> => {};

/** Write content to a unique temp file and return its path */
export async function writeTempFile(content: string | Buffer, ext: string): Promise<string> {
  const tmpFile = join(os.tmpdir(), `ava-source-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  await fs.writeFile(tmpFile, content);
  return tmpFile;
}

/** Download a remote URL to a temp file and return its path */
export async function downloadToTempFile(url: string, ext: string, headers?: Record<string, string>): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return writeTempFile(Buffer.from(await response.arrayBuffer()), ext);
}

/** Delete a temp file, ignoring errors */
export async function removeTempFile(filePath: string): Promise<void> {
  await fs.unlink(filePath).catch(() => {});
}

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
      await conn.run(`CREATE OR REPLACE VIEW data AS SELECT * FROM ${READ_FN[format]}('${escapeSql(path)}'${sniff})`);
      return ['data'];
    },
    getSchema: (conn) => getDuckDBSchema(conn, ['data']),
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
