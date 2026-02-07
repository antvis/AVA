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
  /** Threshold for using SQL(in bytes), default 10KB */
  sqlThreshold?: number;
}

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
 * Analysis response
 */
export interface AnalysisResponse {
  /** The analysis result as text */
  text: string;
  /** Optional structured data result */
  data?: any[];
  /** Optional markdown content */
  markdown?: string;
  /** Optional GPT-Vis syntax */
  visualizationSyntax?: string;
  /** Optional visualization HTML code */
  visualizationHTML?: string;
  /** Optional JavaScript code used for data analysis (for small datasets) */
  code?: string;
  /** Optional SQL query used for data analysis (for large datasets with SQLite) */
  sql?: string;
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

/**
 * Result of unified visualization advice and generation
 */
export interface VisualizationResult {
  /** The recommended chart type, null if no visualization intent detected */
  chartType: ChartType | null;
  /** GPT-Vis syntax, undefined if no visualization */
  syntax?: string;
  /** Complete HTML code, undefined if no visualization */
  html?: string;
}
