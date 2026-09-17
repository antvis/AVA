/**
 * Core type definitions for AVA v4
 */

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
 * AVA configuration
 */
export interface AVAConfig {
  /** LLM configuration */
  llm: LLMConfig;
}

/**
 * Data source types for loadSource.
 * - inline types: `csv` (content string), `object`, `url`, `text`
 * - file types: `csv-file`, `json`, `parquet` (read through DuckDB's readers)
 * - database types (mysql/postgresql) are reserved and not implemented yet
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
 * External data source configuration for loadSource.
 * - inline types (csv/object/url/text): data is materialized into JS memory
 * - file types (csv-file/json/parquet): loaded through DuckDB's readers, `options` is FileSourceOptions
 * - database types (mysql/postgresql): `options` is passed through to the connection (reserved)
 */
export type DataSourceConfig =
  | { type: 'csv'; options: CSVSourceOptions }
  | { type: 'object'; options: ObjectSourceOptions }
  | { type: 'url'; options: URLSourceOptions }
  | { type: 'text'; options: TextSourceOptions }
  | { type: 'csv-file'; options: FileSourceOptions }
  | { type: 'json'; options: FileSourceOptions }
  | { type: 'parquet'; options: FileSourceOptions }
  | { type: 'mysql' | 'postgresql'; options: Record<string, unknown> };

/**
 * File formats readable by DuckDB's readers (csv-file maps to csv).
 */
export type FileFormat = 'csv' | 'json' | 'parquet';

/**
 * A loaded data source, ready for an engine to register.
 * Each loader turns its source config into a local file that the engine reads directly.
 */
export interface LoadedSource {
  /** Local file path for the engine to read */
  path: string;
  /** File format, determines which reader is used */
  format: FileFormat;
  /** Release resources (e.g. delete temp files). No-op for pre-existing local files. */
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


