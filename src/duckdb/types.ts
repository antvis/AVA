import type { Schema } from '../contracts/schema';

/**
 * Minimal structural type for a database connection used by LoadedSource.
 * Matches the subset of @duckdb/node-api's DuckDBConnection that loaders use,
 * declared here so the shared types never import the Node-only package.
 */
export interface DuckDBConnection {
  run(sql: string): Promise<unknown>;
  runAndReadAll(sql: string): Promise<{ getRowObjectsJson(): Record<string, unknown>[] }>;
}

/**
 * DuckDB engine resource limits and query timeout. All optional; the engine
 * applies secure defaults (512MB memory, 1 thread, 30s query timeout) so a
 * runaway LLM-generated query cannot exhaust the host's memory/CPU/disk.
 */
export interface DuckDBEngineOptions {
  /** Memory limit, e.g. '512MB'. Default '512MB'. */
  memoryLimit?: string;
  /** Number of worker threads. Default 1. */
  threads?: number;
  /** Max size of the spill (temp) directory, e.g. '1GB'. Unset = unlimited. */
  maxTempDirectorySize?: string;
  /** Per-query timeout in milliseconds. Default 30000. */
  queryTimeoutMs?: number;
  /** Allow DuckDB community extensions during source loading when explicitly needed. */
  allowCommunityExtensions?: boolean;
}

/**
 * File formats readable by DuckDB's readers (csv-file maps to csv, json-file to json).
 */
export type FileFormat = 'csv' | 'json' | 'parquet';

/**
 * A loaded data source, ready for an engine to register as one or more views.
 * File loaders register a single `data` view; database loaders ATTACH and
 * register one view per discovered table.
 */
export interface LoadedSource {
  /** Register the source's table(s)/view(s) and return their exposed names. */
  register: (conn: DuckDBConnection) => Promise<string[]>;
  /** */
  getSchema: (conn: DuckDBConnection) => Promise<Schema>;
  /**
   * Exact files the engine allows after registering (empty for sources without local files).
   */
  allowedPaths: string[];
  /** Release resources (temp files, attached databases, tunnels) */
  cleanup: () => Promise<void>;
}
