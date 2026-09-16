/**
 * External data source resolution for DuckDB (Node.js only).
 * File sources (csv/json/parquet) may be local paths or http(s) URLs; remote files are
 * downloaded to a temp file first (httpfs is intentionally not used), so OSS/S3 objects
 * are supported via signed URLs through the same HTTP path.
 * Database sources (mysql/postgre) are reserved and not implemented yet.
 */

import type { DataSource, DataSourceConfig } from '../types';

/** A resolved file source ready for the duckdb engine (cleanup is always present) */
export type ResolvedSource = Extract<DataSource, { kind: 'file' }> & { cleanup: () => Promise<void> };

/**
 * Resolve a data source config into a local file path for DuckDB.
 */
export async function resolveSource(config: DataSourceConfig): Promise<ResolvedSource> {
  if (typeof window !== 'undefined') {
    throw new Error('loadSource is only supported in Node.js environments.');
  }

  // File sources (csv/json/parquet) — a local path or an http(s) URL
  if (config.type === 'csv' || config.type === 'json' || config.type === 'parquet') {
    const { type: format, options } = config;
    const { path: sourcePath, headers } = options;
    const noop = async () => {};

    // Local file path — use directly
    if (!/^https?:\/\//.test(sourcePath)) {
      return { kind: 'file', path: sourcePath, format, cleanup: noop };
    }

    // Remote file — download to a temp file (DuckDB stays offline)
    const response = await fetch(sourcePath, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourcePath}: ${response.status} ${response.statusText}`);
    }

    const fs = await import('fs/promises');
    const os = await import('os');
    const nodePath = await import('path');
    const tmpFile = nodePath.join(
      os.tmpdir(),
      `ava-source-${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`
    );
    await fs.writeFile(tmpFile, Buffer.from(await response.arrayBuffer()));

    return {
      kind: 'file',
      path: tmpFile,
      format,
      cleanup: async () => {
        await fs.unlink(tmpFile).catch(() => {});
      },
    };
  }

  // Database sources (mysql/postgre) are reserved and not implemented yet
  throw new Error(`loadSource: "${config.type}" sources are not supported yet.`);
}
