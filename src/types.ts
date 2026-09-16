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
 * Analysis engine type:
 * - `code`: in-memory JavaScript execution (works in both Node.js and browser)
 * - `duckdb`: DuckDB SQL execution (Node.js only; required for file/remote sources and large data)
 */
export type EngineType = 'code' | 'duckdb';

/**
 * AVA configuration
 */
export interface AVAConfig {
  /** LLM configuration */
  llm: LLMConfig;
  /** Analysis engine, defaults to 'code' */
  engine?: EngineType;
}

/**
 * Data file formats supported by loadSource, read through DuckDB's readers
 */
export type SourceFormat = 'csv' | 'json' | 'parquet';

/**
 * External source types for loadSource.
 * Database types (mysql/postgre) are reserved and not implemented yet.
 */
export type SourceType = SourceFormat;

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
 * External data source configuration for loadSource.
 * - file types (csv/json/parquet): loaded through DuckDB's readers, `options` is FileSourceOptions
 * - database types (mysql/postgre): `options` is passed through to the connection (reserved)
 */
export type DataSourceConfig =
  | { type: SourceFormat; options: FileSourceOptions }
  | { type: 'mysql' | 'postgre'; options: Record<string, unknown> };

/**
 * Unified data source consumed by analysis engines.
 * - `inline`: data already materialized as an object array (object/text/parsed csv/url)
 * - `file`: a local csv/json/parquet file (remote files are downloaded to temp files first)
 *
 * Extensible — database sources (e.g. mysql) can be added as new variants later.
 */
export type DataSource =
  | { kind: 'inline'; data: any[] }
  | { kind: 'file'; path: string; format: SourceFormat; cleanup?: () => Promise<void> };

/**
 * Data field metadata
 */
export interface FieldMetadata {
  /** Field name */
  name: string;
  /** Field type */
  type: 'number' | 'string' | 'date' | 'boolean';
  /** Sample values */
  samples?: any[];
  /** Number of unique values */
  uniqueCount?: number;
  /** Number of null values */
  nullCount?: number;
}

/**
 * Dataset information
 */
export interface DatasetInfo {
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Field metadata */
  fields: FieldMetadata[];
  /** Estimated size in bytes */
  sizeInBytes: number;
}

/**
 * An analysis engine: loads a data source, turns natural-language queries
 * into its executable DSL (JavaScript or SQL) via LLM, and executes it.
 * Implemented by CodeEngine (code/) and DuckDBEngine (duckdb/).
 */
export interface AnalysisEngine {
  /** Load a data source and return its metadata */
  load(source: DataSource): Promise<DatasetInfo>;
  /** Generate the executable DSL (SQL or JS code) for a natural-language query */
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
  /** The engine that produced this result ('code' | 'duckdb') */
  engine: EngineType;
  /** The DSL executed for the analysis (JS code for the code engine, SQL for duckdb) */
  dsl?: string;
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


