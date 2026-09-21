/**
 * AVA v4 - Browser entry point
 * Only registers the interpreter engine, so Node-only engines (DuckDB,
 * Supabase) and their dependencies are never traced into browser bundles.
 */
import { InterpreterEngine } from './interpreter';
import { registerEngine } from './engines';

registerEngine('interpreter', InterpreterEngine);

export { AVA } from './ava';
export type { InterpreterEngine } from './interpreter';
export type {
  LLMConfig,
  AVAConfig,
  AnalysisConfig,
  EngineConfig,
  DuckDBEngineOptions,
  DataSourceConfig,
  Schema,
  TableSchema,
  FieldMetadata,
  AnalysisEngine,
  QueryDialect,
  AnalysisResponse,
  AnalysisStrategy,
  AnalysisStrategyConfig,
  AnalysisRuntime,
  VisualizeResponse,
  SuggestResult,
  ChartType,
} from './types';
