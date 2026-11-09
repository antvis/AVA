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

export {
  sourceInputSchema,
  schemaInputSchema,
  schemaOutputSchema,
  profileInputSchema,
  profileOutputSchema,
  semanticInputSchema,
  semanticOutputSchema,
  queryInputSchema,
  queryOutputSchema,
  analyzeInputSchema,
  analyzeOutputSchema,
  translateInputSchema,
  translateOutputSchema,
  suggestInputSchema,
  suggestOutputSchema,
  recommendInputSchema,
  recommendOutputSchema,
  visualizeInputSchema,
  visualizeOutputSchema,
  vizInputSchema,
  vizOutputSchema,
} from './contracts';

export { inferFileSourceType } from './util/source';
export { bindChartData } from './visualization/bind';

export { AVA } from './ava';
export { registerEngine } from './engines';

export { executionResult } from './util/result';

export type {
  SourceInput,
  SchemaInput,
  SchemaOutput,
  ProfileInput,
  ProfileOutput,
  SemanticInput,
  SemanticOutput,
  QueryInput,
  QueryOutput,
  AnalyzeInput,
  AnalyzeOutput,
  TranslateInput,
  TranslateOutput,
  SuggestInput,
  SuggestOutput,
  RecommendInput,
  RecommendOutput,
  VisualizeInput,
  VisualizeOutput,
  VizInput,
  VizOutput,
  ChartDataBinding,
  EngineClass,
  JavaScriptEngine,
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
  ChartSpecInput,
  SuggestResult,
  ChartType,
  ProfileOptions,
  ParsedProfileOptions,
  Metric,
  MetricId,
  MetricConfig,
  LogicalType,
} from './types';
