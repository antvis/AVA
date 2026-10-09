/**
 * AVA v4 - Browser entry point
 * Only registers the JavaScript interpreter engine, so Node-only engines (DuckDB,
 * Supabase, ClickHouse) and their dependencies are never traced into browser bundles.
 */
import { JavaScriptEngine } from './interpreter/javascript';
import { registerEngine } from './engines';

registerEngine('javascript', JavaScriptEngine);

export { AVA } from './ava';
export type { JavaScriptEngine } from './interpreter/javascript';
export type {
  LLMConfig,
  AVAConfig,
  AnalysisConfig,
  EngineConfig,
  DuckDBEngineOptions,
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
