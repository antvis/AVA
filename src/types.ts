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
 * Data source types for load.
 * - inline types: `csv` (content string), `json` (object array), `text`
 * - file types: `csv-file`, `json-file`, `parquet` (read through DuckDB's readers)
 * - database types: `mysql`, `postgresql` (ATTACH through DuckDB's extension)
 * - cloud types: `supabase` (schema discovered and SQL executed through the Supabase Management API — data never leaves the SaaS; handled by SaasDBEngine)
 */
export type SourceType =
  | 'csv'
  | 'json'
  | 'text'
  | 'csv-file'
  | 'json-file'
  | 'parquet'
  | 'excel'
  | 'mysql'
  | 'postgresql'
  | 'supabase';

/**
 * Options for inline CSV data sources (raw CSV content string)
 */
export interface CSVSourceOptions {
  /** Raw CSV content string */
  csv: string;
}

/**
 * Options for CSV file sources: a local file path or an http(s) URL
 */
export interface CSVFileSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for inline JSON data sources (object array)
 */
export interface JsonSourceOptions {
  data: any[];
}

/**
 * Options for JSON file sources: a local file path or an http(s) URL
 */
export interface JsonFileSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for Parquet file sources: a local file path or an http(s) URL
 */
export interface ParquetSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for Excel file sources: a local file path or an http(s) URL.
 * Every sheet in the workbook is registered as its own view.
 */
export interface ExcelSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for text data sources (extracted via LLM)
 */
export interface TextSourceOptions {
  text: string;
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
  /** Schema the tables live in (defaults to `public`) */
  schema?: string;
  /** Optional SSH tunnel the PostgreSQL connection is forwarded through */
  ssh?: SSHOptions;
}

/**
 * Options for Supabase data sources (handled by SaasDBEngine, not the DuckDB
 * engine). Schema is discovered and SQL is executed through the Supabase
 * Management API — data never leaves the SaaS. The OAuth handshake
 * (authorize/token exchange/refresh) is out of scope: the consuming app
 * obtains the access token and passes it here.
 */
export interface SupabaseSourceOptions {
  /** OAuth access token from the Supabase Management API OAuth flow */
  accessToken: string;
  /** Project reference (as returned by GET https://api.supabase.com/v1/projects) */
  projectRef: string;
}

/**
 * External data source configuration for loadSource.
 * - inline types (csv/json/text): data is materialized into JS memory
 * - file types (csv-file/json-file/parquet): loaded through DuckDB's readers
 * - database types (mysql/postgresql): ATTACH through DuckDB's extension
 * - cloud types (supabase): schema/SQL over the Management API (SaasDBEngine)
 */
export type DataSourceConfig =
  | { type: 'csv'; options: CSVSourceOptions }
  | { type: 'json'; options: JsonSourceOptions }
  | { type: 'text'; options: TextSourceOptions }
  | { type: 'csv-file'; options: CSVFileSourceOptions }
  | { type: 'json-file'; options: JsonFileSourceOptions }
  | { type: 'parquet'; options: ParquetSourceOptions }
  | { type: 'excel'; options: ExcelSourceOptions }
  | { type: 'mysql'; options: MySQLSourceOptions }
  | { type: 'postgresql'; options: PostgreSQLSourceOptions }
  | { type: 'supabase'; options: SupabaseSourceOptions };

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
  /**
   * Register the source's view(s) on the given connection and return the
   * names of all registered views (the engine exposes each to the LLM).
   */
  register: (conn: DuckDBConnection) => Promise<string[]>;
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
 * Schema of a single table/view in the loaded data source
 */
export interface TableSchema {
  /** Table/view name as registered in the engine */
  name: string;
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Field metadata */
  fields: FieldMetadata[];
}

/**
 * Dataset schema — metadata describing the loaded data source.
 * A source may expose multiple tables (e.g. a MySQL database or a multi-sheet
 * Excel workbook); each is registered as its own view so the LLM can JOIN them.
 */
export interface Schema {
  /** All tables/views exposed by the data source */
  tables: TableSchema[];
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


