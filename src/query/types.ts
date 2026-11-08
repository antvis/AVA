import type { LanguageModelUsage } from 'ai';
import type { DataModel } from '../contracts/data-model';

/** Execution language id exposed by a query dialect. */
export type QueryLanguage = string;

/** Executable DSL and its model usage, when available. */
export interface TranslationResult {
  dsl: string;
  usage?: LanguageModelUsage;
}

/**
 * Generates and validates code for one query language.
 */
export interface QueryDialect {
  readonly id: string;
  /** Language rules and execution bindings, independent of the model response format. */
  readonly rules: string;
  /** Generate executable code for a natural-language query. */
  getDSL(query: string, dataModel: DataModel): Promise<TranslationResult>;
  /** Validate the DSL without executing it, preserving its source semantics. */
  validateDSL(dsl: string): Promise<string>;
}
