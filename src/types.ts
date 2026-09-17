/**
 * Core type definitions for AVA v4
 */

import type { DuckDBConnection } from '@duckdb/node-api';

/**
 * LLM configuration
 */
export interface LLMConfig {
  /** Model name (e.g., 'gpt-4', 'gpt-3.5-turbo') */
  model: string;
  /** API key for the LLM provider */
  apiKey: string;
  /** Optional API base URL */
  baseURL?: string;
}

/**
 * DuckDB engine resource limits and query timeout. All optional; the engine
 * applies secure defaults (512MB memory, 1 thread, 30s query timeout) so a
 * runaway LLM-generated query cannot exhaust the host's memory/CPU/disk.
 */
export interface EngineOptions {
  /** Memory limit, e.g. '512MB'. Default '512MB'. */
  memoryLimit?: string;
  /** Number of worker threads. Default 1. */
  threads?: number;
  /** Max size of the spill (temp) directory, e.g. '1GB'. Unset = unlimited. */
  maxTempDirectorySize?: string;
  /** Per-query timeout in milliseconds. Default 30000. */
  queryTimeoutMs?: number;
}

/**
 * AVA configuration
 */
export interface AVAConfig {
  /** LLM configuration */
  llm: LLMConfig;
  /** Optional DuckDB engine resource limits (defaults applied when omitted) */
  engine?: EngineOptions;
}

/**
 * Data source types for loadSource.
 * - inline types: `csv` (content string), `object`, `url`, `text`
 * - file types: `csv-file`, `json`, `parquet` (read through DuckDB's readers)
 * - database types: `mysql` (ATTACH through DuckDB's mysql extension); `postgresql` is reserved
 */
export type SourceType =
  | 'csv'
  | 'object'
  | 'url'
  | 'text'
  | 'csv-file'
  | 'json'
  | 'parquet'
  | 'mysql'
  | 'postgresql';

/**
 * Options for file sources: a local file path or an http(s) URL
 */
export interface FileSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for inline data sources (object array)
 */
export interface ObjectSourceOptions {
  data: any[];
}

/**
 * Options for URL data sources
 */
export interface URLSourceOptions {
  url: string;
  transform?: (response: any) => any[];
}

/**
 * Options for text data sources (extracted via LLM)
 */
export interface TextSourceOptions {
  text: string;
}

/**
 * Options for CSV data sources (file path or content string)
 */
export interface CSVSourceOptions {
  /** File path (Node.js) or CSV content string (browser) */
  pathOrContent: string;
}

/**
 * SSH tunnel options for database sources (forwards the connection through an SSH server)
 */
export interface SSHOptions {
  host: string;
  port?: number;
  user: string;
  password?: string;
}

/**
 * Options for MySQL data sources (ATTACH through DuckDB's mysql extension)
 */
export interface MySQLSourceOptions {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  /** Table to read as the data view */
  table: string;
  /** Optional SSH tunnel the MySQL connection is forwarded through */
  ssh?: SSHOptions;
}

/**
 * Options for PostgreSQL data sources (ATTACH through DuckDB's postgres extension)
 */
export interface PostgreSQLSourceOptions {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  /** Table to read as the data view */
  table: string;
  /** Schema the table lives in (defaults to `public`) */
  schema?: string;
  /** Optional SSH tunnel the PostgreSQL connection is forwarded through */
  ssh?: SSHOptions;
}

/**
 * External data source configuration for loadSource.
 * - inline types (csv/object/url/text): data is materialized into JS memory
 * - file types (csv-file/json/parquet): loaded through DuckDB's readers, `options` is FileSourceOptions
 * - database types (mysql/postgresql): ATTACH through DuckDB's extension
 */
export type DataSourceConfig =
  | { type: 'csv'; options: CSVSourceOptions }
  | { type: 'object'; options: ObjectSourceOptions }
  | { type: 'url'; options: URLSourceOptions }
  | { type: 'text'; options: TextSourceOptions }
  | { type: 'csv-file'; options: FileSourceOptions }
  | { type: 'json'; options: FileSourceOptions }
  | { type: 'parquet'; options: FileSourceOptions }
  | { type: 'mysql'; options: MySQLSourceOptions }
  | { type: 'postgresql'; options: PostgreSQLSourceOptions };

/**
 * File formats readable by DuckDB's readers (csv-file maps to csv).
 */
export type FileFormat = 'csv' | 'json' | 'parquet';

/**
 * A loaded data source, ready for an engine to register as the data view.
 * File loaders register a local file; database loaders ATTACH and register a table.
 */
export interface LoadedSource {
  /** Register the source as the `tableName` view on the given connection */
  register: (conn: DuckDBConnection, tableName: string) => Promise<void>;
  /**
   * Directories the engine whitelists for file access after registering
   * (the data file's directory for file sources; empty for in-memory/remote sources).
   */
  allowedDirectories: string[];
  /** Release resources (temp files, attached databases, tunnels) */
  cleanup: () => Promise<void>;
}

/**
 * Data field metadata
 */
export interface FieldMetadata {
  /** Field name */
  name: string;
  /** Field type */
  type: 'number' | 'string' | 'date' | 'boolean';
  /** Raw column type from the engine (e.g. DuckDB's BIGINT/VARCHAR), when available */
  rawType?: string;
  /** Distinct values (categorical fields, up to 20) */
  samples?: any[];
  /** Number of unique values */
  uniqueCount?: number;
  /** Number of null values */
  nullCount?: number;
  /** Minimum value (numeric fields; temporal fields as epoch ms) */
  min?: number;
  /** Maximum value (numeric fields; temporal fields as epoch ms) */
  max?: number;
}

/**
 * Dataset schema — metadata describing the loaded data
 */
export interface Schema {
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Field metadata */
  fields: FieldMetadata[];
}

/**
 * An analysis engine: loads a data source, turns natural-language queries
 * into its executable DSL (SQL) via LLM, and executes it.
 * Currently implemented by DuckDBEngine (duckdb/); kept as an interface
 * to allow alternative engines in the future.
 */
export interface AnalysisEngine {
  /** Load a data source config and return its schema */
  load(config: DataSourceConfig): Promise<Schema>;
  /** Generate the executable DSL (SQL) for a natural-language query */
  getDSL(query: string): Promise<string>;
  /** Execute a DSL returned by getDSL against the loaded data */
  execute(dsl: string): Promise<any>;
  /** Release resources (temp files, database connections) */
  dispose(): Promise<void>;
}

/**
 * Analysis response — data analysis results only (no visualization)
 */
export interface AnalysisResponse {
  /** The original user query */
  query: string;
  /** The analysis result as text */
  text: string;
  /** Optional structured data result */
  data?: any[];
  /** Optional markdown content */
  markdown?: string;
  /** The SQL executed for the analysis */
  sql?: string;
}

/**
 * Visualization response — chart generation results
 */
export interface VisualizeResponse {
  /** Recommended chart type */
  chartType: ChartType;
  /** GPT-Vis syntax */
  syntax: string;
  /** Standalone HTML that renders the chart */
  html: string;
}

/**
 * Supported chart types from GPT-Vis
 */
export type ChartType =
  | 'line'
  | 'column'
  | 'bar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'dual-axes'
  | 'histogram'
  | 'boxplot'
  | 'radar'
  | 'funnel'
  | 'waterfall'
  | 'liquid'
  | 'word-cloud'
  | 'violin'
  | 'venn'
  | 'treemap'
  | 'sankey'
  | 'table'
  | 'summary';

/**
 * Chart type definition — structured metadata for prompt generation
 */
export interface ChartTypeDefinition {
  /** Chart type identifier */
  type: ChartType;
  /** Chinese name */
  name: string;
  /** Feature descriptions */
  features: string[];
  /** Applicable use cases */
  useCases: string[];
  /** Data requirements */
  dataRequirements: string[];
  /** Limitations / inapplicable scenarios */
  limitations: string[];
}

/**
 * Result of a suggested query
 */
export interface SuggestResult {
  /** The suggested query string */
  query: string;
  /** Score between 0-1 indicating meaningfulness */
  score: number;
  /** Reason for the score */
  reason: string;
}


