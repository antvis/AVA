/**
 * AVA v4 - Browser entry point
 * Only registers the JavaScript interpreter engine, so Node-only engines (DuckDB,
 * Supabase, ClickHouse) and their dependencies are never traced into browser bundles.
 */
import { JavaScriptEngine } from './interpreter/javascript';
import { registerEngine } from './engines';

registerEngine('javascript', JavaScriptEngine);

export { AVA } from './ava';
export { registerEngine } from './engines';
export type { JavaScriptEngine } from './interpreter/javascript';
export type {
  DataModel,
  Semantic,
  Model,
  Column,
  Relationship,
  JoinType,
  View,
  Cube,
  Measure,
  CubeDimension,
  TimeDimension,
  TableReference,
  PrimaryKey,
  Properties,
  JsonValue,
  Schema,
  Profile,
  LLMConfig,
  AVAConfig,
  AnalysisConfig,
  EngineConfig,
  DuckDBEngineOptions,
  DataSourceConfig,
  SchemaOptions,
  SemanticOptions,
  JSONReadOptions,
  ClickHouseSourceOptions,
  AnalysisEngine,
  TranslationResult,
  ExecutionOptions,
  ExecutionResult,
  QueryLanguage,
  QueryDialect,
  AnalysisResponse,
  AnalysisStrategy,
  AnalysisStrategyConfig,
  AnalysisRuntime,
  VisualizeResponse,
  ChartSpec,
  SuggestResult,
  ChartType,
  ProfileOptions,
  ParsedProfileOptions,
  Metric,
  MetricId,
  MetricConfig,
  LogicalType,
} from './types';
