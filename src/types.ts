/** Compatibility exports; definitions live with their contracts or owning module. */

export type { LLMConfig, AVAConfig } from './config';
export type { DuckDBConnection, DuckDBEngineOptions, FileFormat, LoadedSource } from './duckdb/types';
export type { PythonEngineOptions } from './interpreter/python/types';
export type { EngineConfig, AnalysisEngine } from './engines';
export type {
  AnalysisConfig,
  AnalysisStrategyConfig,
  AnalysisResponse,
  JsonValue,
  Properties,
  Column,
  TableReference,
  PrimaryKey,
  Model,
  JoinType,
  Relationship,
  View,
  Measure,
  CubeDimension,
  TimeDimension,
  Cube,
  DataModel,
  Semantic,
  SemanticOptions,
  SchemaOptions,
  Schema,
  LogicalType,
  MetricId,
  MetricConfig,
  ProfileOptions,
  ParsedProfileOptions,
  Profile,
  ExecutionOptions,
  ExecutionResult,
  QueryColumn,
  ChartSpec,
  ChartSpecInput,
  VisualizeResponse,
  ChartType,
  SuggestResult,
  ExcelSheetOptions,
  ExcelReadOptions,
  SourceType,
  CSVReadOptions,
  JSONReadOptions,
  CSVSourceOptions,
  CSVFileSourceOptions,
  JsonSourceOptions,
  JsonFileSourceOptions,
  ParquetSourceOptions,
  ExcelSourceOptions,
  TextSourceOptions,
  SSHOptions,
  MySQLSourceOptions,
  SQLiteSourceOptions,
  PostgreSQLSourceOptions,
  MongoDBSourceOptions,
  SupabaseSourceOptions,
  ClickHouseSourceOptions,
  FeishuBitableSourceOptions,
  SQLServerSourceOptions,
  SnowflakeSourceOptions,
  DataSourceConfig,
} from './contracts';
export type { AnalysisRuntime, AnalysisStrategy } from './analysis/types';
export type { QueryLanguage, TranslationResult, QueryDialect } from './query/types';

export type { MetricOption, Metric } from './util/profile';

export type { ChartConfig, ChartTypeDefinition } from './visualization/types';
