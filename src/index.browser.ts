/**
 * AVA v4 - Browser entry point
 * Only registers the JavaScript interpreter engine, so Node-only engines (DuckDB,
 * Supabase, ClickHouse) and their dependencies are never traced into browser bundles.
 */
import { JavaScriptEngine } from './interpreter/javascript';
import { registerEngine } from './engines';

registerEngine('javascript', JavaScriptEngine);

export {
  sourceInputSchema,
  schemaInputSchema,
  schemaOutputSchema,
  profileInputSchema,
  profileOutputSchema,
  qualityInputSchema,
  qualityOutputSchema,
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

export { AVA } from './ava';
export { compareProfiles } from './util/profile-compare';
export type { ProfileComparison } from './util/profile-compare';
export { renderProfileHtml, renderProfileComparisonHtml, renderProfileValidationHtml } from './util/profile-report';
export { profileExpectations, validateProfileExpectations } from './util/profile-expectations';
export type { ProfileExpectationSuite } from './util/profile-expectations';
export { registerEngine } from './engines';

export type {
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
  ProfileType,
  Quality,
  QualityOptions,
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
