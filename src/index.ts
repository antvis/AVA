/**
 * AVA v4 - Node.js entry point
 * Registers all engines (DuckDB, Supabase, interpreter) before exporting AVA.
 */
import { DuckDBEngine } from './duckdb';
import { InterpreterEngine } from './interpreter';
import { SupabaseEngine } from './saas';
import { registerEngine } from './engines';

registerEngine('duckdb', DuckDBEngine);
registerEngine('supabase', SupabaseEngine);
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
  TableIndex,
  TableRelation,
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
