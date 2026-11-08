/**
 * AVA v4 - Node.js entry point
 * Registers all engines before exporting AVA.
 */

import { DuckDBEngine } from './duckdb';
import { JavaScriptEngine, PythonEngine } from './interpreter';
import { ClickHouseEngine, SnowflakeEngine, SQLServerEngine, SupabaseEngine } from './remote';
import { registerEngine } from './engines';

registerEngine('duckdb', DuckDBEngine);
registerEngine('clickhouse', ClickHouseEngine);
registerEngine('sqlserver', SQLServerEngine);
registerEngine('snowflake', SnowflakeEngine);
registerEngine('supabase', SupabaseEngine);
registerEngine('javascript', JavaScriptEngine);
registerEngine('python', PythonEngine);

export { sourceConfigSchema } from './contracts/source';
export { executionResultSchema } from './contracts/result';
export { chartSpecSchema } from './contracts/chart';
export { inferFileSourceType } from './util/source';
export { bindChartData } from './visualization/bind';
export type { ChartDataBinding } from './visualization/bind';

export { AVA } from './ava';
export { registerEngine } from './engines';
export type { EngineClass } from './engines';
export { executionResult } from './util/result';

export type { JavaScriptEngine } from './interpreter';
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
  PythonEngineOptions,
  DataSourceConfig,
  SchemaOptions,
  SemanticOptions,
  JSONReadOptions,
  ClickHouseSourceOptions,
  SQLServerSourceOptions,
  SnowflakeSourceOptions,
  AnalysisEngine,
  TranslationResult,
  ExecutionOptions,
  ExecutionResult,
  QueryColumn,
  QueryLanguage,
  QueryDialect,
  AnalysisResponse,
  AnalysisStrategy,
  AnalysisStrategyConfig,
  AnalysisRuntime,
  VisualizeResponse,
  ChartConfig,
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
