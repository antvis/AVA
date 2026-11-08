import type { ExecutionOptions, ExecutionResult } from './query';

/** Per-analysis options. */
export interface AnalysisConfig extends ExecutionOptions {
  /** Include a natural-language summary. Defaults to true; false returns empty text. */
  includeSummary?: boolean;
  /** Strategy for this analysis (defaults to direct). */
  strategy?: AnalysisStrategyConfig;
}

/** Built-in analysis strategies. */
export type AnalysisStrategyConfig =
  | {
      type: 'direct';
      /** Execution correction retries after the initial attempt. defaults to 2. */
      maxRetries?: number;
    }
  | { type: 'loop'; maxSteps?: number };

/**
 * Analysis response — data analysis results only (no visualization)
 */
export interface AnalysisResponse<T = Record<string, unknown>> extends ExecutionResult<T> {
  /** The original user query */
  query: string;
  /** The analysis result as text; empty when includeSummary is false. */
  text: string;
  /** Optional markdown content */
  markdown?: string;
  /** The SQL executed for the analysis */
  sql?: string;
}
