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
  /** Optional JavaScript code used for data analysis (for small datasets) */
  code?: string;
  /** Optional SQL query used for data analysis (for large datasets with SQLite) */
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
 * Visualization options
 */
export interface VisualizeOptions {
  /** Progress callback, pushes visualization progress step by step */
  onProgress?: AnalysisProgressCallback;
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
  nameZh: string;
  /** English name */
  nameEn: string;
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
 * Structured result from chart type advisor
 */
export interface ChartAdvisorResult {
  /** Recommended chart type, null if no visualization intent detected */
  chartType: ChartType | null;
  /** Confidence score 0-1 */
  confidence: number;
  /** Reason for the recommendation */
  reason: string;
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

/**
 * Status of a single analysis step
 */
export type StepStatus = 'pending' | 'running' | 'done' | 'error';

/**
 * A single analysis step
 * Designed to be JSON-serializable for history storage
 */
export interface AnalysisStep {
  /** Unique step ID */
  id: string;
  /** Agent identifier, reserved for multi-agent scenarios. Currently fixed as 'main' */
  agent: string;
  /** Step phase identifier, such as 'code', 'execute', 'summarize', 'advisor', 'visualize' */
  phase: string;
  /** Short label for UI display, e.g., "Generate analysis code" */
  label: string;
  /** Current step status */
  status: StepStatus;
  /** Optional: raw output summary, shown when user clicks "view" */
  detail?: string;
  /** Optional: error message when step fails */
  error?: string;
  /** Unix millisecond timestamp, updated on step status change */
  timestamp: number;
}

/**
 * Progress callback function type
 */
export type AnalysisProgressCallback = (steps: AnalysisStep[]) => void;

/**
 * Parameters for emitting a single analysis step
 */
export type StepEmitterParams = { phase: string; params: { status: StepStatus; detail?: string; error?: string } };

/**
 * Extended options for the analysis() method
 */
export interface AnalysisOptions {
  /** Progress callback, pushes analysis progress step by step */
  onProgress?: AnalysisProgressCallback;
}
