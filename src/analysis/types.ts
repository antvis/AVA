import type { AnalysisConfig, AnalysisResponse } from '../contracts/analyze';
import type { AnalysisEvent } from '../event';
import type { DataModel } from '../contracts/shared/data-model';
import type { AnalysisEngine } from '../engines';
import type { LLMConfig } from '../config';

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
