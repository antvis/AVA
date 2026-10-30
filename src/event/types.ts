import type { LanguageModelUsage } from 'ai';
import type { ExecutionResult } from '../types';
import type { SerializedError } from '../util/error';

export type AnalysisEventContext = {
  /** Unique event ID: `${pairId}:start` or `${pairId}:end`; retries use a new pair ID. */
  eventId?: string;
  /** Groups operations that belong to the same sub-analysis. */
  stepId?: string;
  /** Identifies sub-analyses whose results this step depends on. */
  parentStepIds?: string[];
};

export type TranslateStartPayload = {
  /** The original question this translation is trying to answer. */
  query: string;
};

export type LLMPayload = {
  /** Token usage reported by the model, when available. */
  usage?: LanguageModelUsage;
};

export type TranslateEndPayload = LLMPayload &
  (
    | {
        /** The generated statement; it has not necessarily been executed. */
        dsl: string;
        error?: never;
      }
    | {
        /** Why the statement could not be generated. */
        error: SerializedError;
        dsl?: never;
      }
  );

export type QueryStartPayload = {
  /** The statement to execute against the current data source. */
  dsl: string;
};

export type QueryEndPayload =
  | (ExecutionResult & { error?: never })
  | {
      /** Why the statement could not be executed. */
      error: SerializedError;
    };

export type SummarizeStartPayload = {
  /** The query-end event ID whose result will be summarized. */
  queryId: string;
};

export type SummarizeEndPayload = LLMPayload &
  (
    | {
        /** Explains how the executed statement selects and calculates data. */
        queryExplanation: string;
        /** Describes limits that affect how the result can be interpreted. */
        limitations?: string;
        /** Answers the question using the returned evidence. */
        conclusion: string;
        /** Suggests a question or analysis to pursue next. */
        nextStep?: string;
        error?: never;
      }
    | {
        /** Why the result could not be summarized. */
        error: SerializedError;
      }
  );

export type StepAction = 'EXPLORE' | 'REFINE' | 'SQL' | 'CONFIRM';

export type StepStartPayload = {
  /** Zero-based analysis step; direct analysis has a single step numbered 0. */
  step: number;
  /** Marks the final fallback after normal iterations are exhausted. */
  finalAttempt?: boolean;
};

export type StepEndPayload = StepStartPayload & LLMPayload &
  (
    | {
        action: StepAction;
        /** The loop model's response, or the direct analysis conclusion (empty when summary is disabled). */
        text: string;
        error?: never;
      }
    | {
        /** Why the iteration could not continue. */
        error: SerializedError;
        action?: StepAction;
        text?: string;
      }
  );
