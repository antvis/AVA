import type { LanguageModelUsage } from 'ai';
import type { ExecutionResult } from '../types';
import type { SerializedError } from '../util/error';

export type CreateStartPayload = object | null;
export type CreateEndPayload = object | null;

export type DisposeStartPayload = object | null;
export type DisposeEndPayload = object | null;

export type SourceStartPayload = object | null;
export type SourceEndPayload = object | null;

export type SchemaStartPayload = object | null;
export type SchemaEndPayload = object | null;

export type ProfileStartPayload = object | null;
export type ProfileEndPayload = object | null;

export type SemanticStartPayload = object | null;
export type SemanticEndPayload = object | null;

export type AnalyzeStartPayload = object | null;
export type AnalyzeEndPayload = object | null;

export type VisualizeStartPayload = object | null;
export type VisualizeEndPayload = object | null;

export type SuggestStartPayload = object | null;
export type SuggestEndPayload = object | null;

export type AnalysisEventContext = {
  /** Pairs start and end events for one operation; retries use a new ID. */
  operationId?: string;
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
  /** The operation ID of the query whose result will be summarized. */
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

export type ReasonStartPayload = object | null;
export type ReasonEndPayload = object | null;
