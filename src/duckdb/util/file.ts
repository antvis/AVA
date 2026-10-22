/**
 * File helpers for the DuckDB engine: temp file creation, remote download,
 * cleanup, and the shared file-source helpers used by the file-based loaders
 * (csv-file, json-file, parquet). A local file path is used directly; a remote
 * HTTP(S) URL is read through DuckDB's httpfs extension. Node.js only.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { join, resolve } from 'node:path';

import { READ_FN, escapeSql, serializeOptions, sqlStringLiteral } from '../../util/sql';

import { getDuckDBSchema } from './schema';

import type { CSVReadOptions, JSONReadOptions, FileFormat, LoadedSource } from '../../types';

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
 * Build a LoadedSource exposing a file as `data`. JSON is parsed into a typed
 * table once; CSV/Parquet views read lazily, so those files must outlive the engine.
 * Only the source file(s) are allowed after hardening.
 * `options` carries extra DuckDB reader options (applied to CSV and JSON readers).
 */
export function fileSource(
  sourcePath: string,
  format: FileFormat,
  cleanup: () => Promise<void>,
  options?: CSVReadOptions | JSONReadOptions
): LoadedSource {
  const isRemote = /^https?:\/\//i.test(sourcePath);
  const path = isRemote ? sourcePath : resolve(sourcePath);
  const allowedPaths = [path];
  return {
    register: async (conn) => {
      if (!isRemote && /[*?[]/.test(path)) {
        const files = await conn.runAndReadAll('SELECT file FROM glob($1)', [path]);
        // The pattern permits enumeration; each matched file needs its own permission.
        allowedPaths.push(...files.getRowObjectsJson().map((row) => String(row.file)));
      }
      if (isExtendedCSVEncoding(format, options && 'encoding' in options ? options.encoding : undefined)) {
        // Auto-install/load is disabled; prepare extended encodings before access is locked.
        await conn.run('INSTALL encodings');
        await conn.run('LOAD encodings');
      }
      const object = format === 'json' ? 'TABLE' : 'VIEW';
      const sniff = format === 'parquet' ? '' : serializeOptions(options);
      await conn.run(
        `CREATE OR REPLACE ${object} data AS SELECT * FROM ${READ_FN[format]}('${escapeSql(path)}'${sniff})`
      );
      return ['data'];
    },
    getSchema: (conn) => getDuckDBSchema(conn, ['data']),
    allowedDirectories: [],
    allowedPaths,
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
 * place, HTTP(S) URLs are read through the native reader and httpfs.
 */
export function createFileLoader<T extends FileLoaderOptions>(format: FileFormat) {
  return async (loaderOptions: T): Promise<LoadedSource> => {
    const { path: sourcePath, headers, options } = loaderOptions;
    if (!/^https?:\/\//i.test(sourcePath)) {
      const path = resolve(sourcePath);
      const isDirectory = format === 'parquet' && (await fs.stat(path).catch(() => null))?.isDirectory();
      return fileSource(isDirectory ? join(path, '**', '*.parquet') : path, format, noopCleanup, options);
    }
    const url = new URL(sourcePath);
    if (url.username || url.password) throw new Error('Use headers instead of credentials in an HTTP(S) source URL');
    const source = fileSource(sourcePath, format, noopCleanup, options);
    return {
      ...source,
      register: async (conn) => {
        await conn.run('INSTALL httpfs');
        await conn.run('LOAD httpfs');
        await conn.run('SET enable_server_cert_verification = true');
        if (headers && Object.keys(headers).length > 0) {
          const entries = Object.entries(headers).map(
            ([key, value]) => `${sqlStringLiteral(key)}: ${sqlStringLiteral(value)}`
          );
          await conn.run(`CREATE TEMPORARY SECRET ava_source_http (
            TYPE http, SCOPE ${sqlStringLiteral(sourcePath)}, EXTRA_HTTP_HEADERS MAP {${entries.join(', ')}}
          )`);
        }
        return source.register(conn);
      },
    };
  };
}
