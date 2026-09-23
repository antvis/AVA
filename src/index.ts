/**
 * AVA v4 - Node.js entry point
 * Registers all engines (DuckDB, Supabase, interpreter) before exporting AVA.
 */
import { DuckDBEngine, DUCKDB_BUILTIN_METRICS } from './duckdb';
import { InterpreterEngine } from './interpreter';
import { SupabaseEngine } from './saas';
import { registerEngine } from './engines';
import { registerMetrics } from './profile';

registerEngine('duckdb', DuckDBEngine);
registerEngine('supabase', SupabaseEngine);
registerEngine('interpreter', InterpreterEngine);
registerMetrics('duckdb', DUCKDB_BUILTIN_METRICS);

export { AVA } from './ava';
export { registerMetrics, hasMetric } from './profile';
export type { DuckDBMetric, DuckDBMetricExpression } from './duckdb';
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
  ExecutionOptions,
  ExecutionResult,
  QueryLanguage,
  QueryDialect,
  AnalysisResponse,
  AnalysisStrategy,
  AnalysisStrategyConfig,
  AnalysisRuntime,
  VisualizeResponse,
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
