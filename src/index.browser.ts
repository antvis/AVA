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
  DataModel,
  Model,
  Column,
  Relationship,
  JoinType,
  View,
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
  JSONReadOptions,
  ClickHouseSourceOptions,
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
