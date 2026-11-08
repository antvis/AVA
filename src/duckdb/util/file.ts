/**
 * File helpers for the DuckDB engine: temp file creation, remote download,
 * cleanup, and the shared file-source helpers used by the file-based loaders
 * (csv-file, json-file, parquet). A local file path is used directly; a remote
 * URL is downloaded to a temp file first. Node.js only.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { READ_FN, escapeSql, serializeOptions } from '../../util/sql';

import { getDuckDBSchema } from './schema';

import type { CSVReadOptions, JSONReadOptions } from '../../contracts/source';
import type { FileFormat, LoadedSource } from '../types';

const noopCleanup = async (): Promise<void> => {};

/** Write content inside a private per-source directory and return its path. */
export async function writeTempFile(content: string | Buffer, ext: string): Promise<string> {
  const directory = await fs.mkdtemp(join(os.tmpdir(), 'ava-source-'));
  try {
    const tmpFile = join(directory, `data.${ext}`);
    await fs.writeFile(tmpFile, content);
    return tmpFile;
  } catch (error) {
    await fs.rm(directory, { recursive: true, force: true });
    throw error;
  }
}

/** Caller-supplied headers may contain credentials with arbitrary names. */
async function fetchFile(url: string, headers?: Record<string, string>): Promise<Response> {
  const requestHeaders = new Headers(headers);
  let hasHeaders = false;
  requestHeaders.forEach(() => {
    hasHeaders = true;
  });
  if (!hasHeaders) return fetch(url, { headers });

  const origin = new URL(url).origin;
  let current = new URL(url);
  for (let redirects = 0; ; redirects++) {
    const response = await fetch(current, { headers: requestHeaders, redirect: 'manual' });
    const location = response.headers.get('location');
    if (![301, 302, 303, 307, 308].includes(response.status) || location === null) return response;

    await response.body?.cancel();
    const next = new URL(location, current);
    if (next.origin !== origin) {
      throw new Error('Cross-origin redirects are not allowed for remote files with headers');
    }
    // Match native fetch's limit while retaining credentials on same-origin hops.
    if (redirects === 20) throw new Error('Remote file redirect limit exceeded (20)');
    current = next;
  }
}

/** Download a remote URL to a temp file and return its path */
export async function downloadToTempFile(url: string, ext: string, headers?: Record<string, string>): Promise<string> {
  const response = await fetchFile(url, headers);
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return writeTempFile(Buffer.from(await response.arrayBuffer()), ext);
}

/** Delete a temp file and its empty private directory, ignoring errors. */
export async function removeTempFile(filePath: string): Promise<void> {
  await fs.unlink(filePath).catch(() => {});
  await fs.rmdir(dirname(filePath)).catch(() => {});
}

/**
 * Determine whether a CSV encoding requires the 'encodings' extension.
 * Built-in encodings: 'utf-8', 'utf-16', 'latin-1'.
 * Extended encodings include 'gb18030', 'big5', 'shift_jis', 'EUC_CN',
 * 'EUC_JP', 'EUC_KR', 'EUC_TW', 'windows-1251-2000', and 'windows-1252-2000'.
 * The extension supports 1,000+ encodings; see the complete list:
 * https://duckdb.org/docs/current/core_extensions/encodings#all-supported-encodings
 * This predicate selects extension loading; it does not validate encoding names.
 */
function isExtendedCSVEncoding(format: FileFormat, encoding?: string): boolean {
  return format === 'csv' && !!encoding && !['utf-8', 'utf-16', 'latin-1'].includes(encoding);
}

/**
 * Build a LoadedSource that registers a local file as the single `data` view.
 * The view reads the file lazily, so the file must outlive the engine.
 * Only this file is allowed after the engine's access configuration is locked.
 * `options` carries extra DuckDB reader options (applied to CSV and JSON readers).
 */
export function fileSource(
  path: string,
  format: FileFormat,
  cleanup: () => Promise<void>,
  options?: CSVReadOptions | JSONReadOptions
): LoadedSource {
  path = resolve(path);
  return {
    register: async (conn) => {
      if (isExtendedCSVEncoding(format, options && 'encoding' in options ? options.encoding : undefined)) {
        // Auto-install/load is disabled; prepare extended encodings before access is locked.
        await conn.run('INSTALL encodings');
        await conn.run('LOAD encodings');
      }
      // csv/json default to auto_detect=true; a user-supplied auto_detect
      // overrides it because DuckDB applies later duplicate options over earlier ones.
      const sniff = format === 'parquet' ? '' : `, auto_detect=true${serializeOptions(options)}`;
      await conn.run(`CREATE OR REPLACE VIEW data AS SELECT * FROM ${READ_FN[format]}('${escapeSql(path)}'${sniff})`);
      return ['data'];
    },
    getSchema: (conn) => getDuckDBSchema(conn, ['data']),
    allowedPaths: [path],
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
  /** Extra DuckDB reader options (applied to CSV and JSON readers) */
  options?: CSVReadOptions | JSONReadOptions;
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
