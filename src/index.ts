/**
 * AVA v4 - Node.js entry point
 * Registers all engines before exporting AVA.
 */

import { DuckDBEngine } from './duckdb';
import { InterpreterEngine } from './interpreter';
import { PythonEngine } from './python';
import { ClickHouseEngine, SupabaseEngine } from './remote';
import { registerEngine } from './engines';

registerEngine('duckdb', DuckDBEngine);
registerEngine('clickhouse', ClickHouseEngine);
registerEngine('supabase', SupabaseEngine);
registerEngine('interpreter', InterpreterEngine);
registerEngine('python', PythonEngine);

export { AVA } from './ava';

export type { InterpreterEngine } from './interpreter';
export type {
  LLMConfig,
  AVAConfig,
  AnalysisConfig,
  EngineConfig,
  DuckDBEngineOptions,
  PythonEngineOptions,
  DataSourceConfig,
  ClickHouseSourceOptions,
  Schema,
  TableSchema,
  TableIndex,
  TableRelation,
  FieldMetadata,
  AnalysisEngine,
  ExecutionOptions,
  ExecutionResult,
  QueryLanguage,
  QueryDialect,
  AnalysisResponse,
  AnalysisStrategy,
  AnalysisStrategyConfig,
  AnalysisRuntime,
  DataContext,
  VisualizeResponse,
  ChartSpec,
  SuggestResult,
  ChartType,
  Profile,
  TableProfile,
  FieldProfile,
  ProfileOptions,
  ParsedProfileOptions,
  Metric,
  MetricId,
  MetricConfig,
  LogicalType,
} from './types';
