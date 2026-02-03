/**
 * Type definitions for visualization module
 */

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
 * Visualization result
 */
export interface VisualizationResult {
  /** Whether visualization intent was detected */
  hasIntent: boolean;
  /** Selected chart type */
  chartType?: ChartType;
  /** GPT-Vis syntax */
  syntax?: string;
  /** HTML code for visualization */
  html?: string;
}
