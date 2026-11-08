import type { ExecutionOptions, ExecutionResult } from '../contracts/result';
import type { AnalysisEvent } from '../event/index';
import type { DataModel } from '../contracts/data-model';
import type { AnalysisEngine } from '../engines';
import type { LLMConfig } from '../config';

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

/** Runtime dependencies available to an analysis strategy. */
export interface AnalysisRuntime {
  /** Dispatch an analysis stage event. */
  emit: (event: AnalysisEvent) => void;
  dataModel: DataModel;
  engine: AnalysisEngine;
  llm: LLMConfig;
}

/** A replaceable way of analyzing a natural-language query. */
export type AnalysisStrategy = (
  query: string,
  config: AnalysisConfig,
  runtime: AnalysisRuntime
) => Promise<AnalysisResponse>;

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
