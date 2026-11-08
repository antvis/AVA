/** Compatibility exports; definitions live with their contracts or owning module. */

export type { LLMConfig, AVAConfig } from './config';
export type { DuckDBConnection, DuckDBEngineOptions, FileFormat, LoadedSource } from './duckdb/types';
export type { PythonEngineOptions } from './interpreter/python/types';
export type { EngineConfig, AnalysisEngine } from './engines';
export type {
  AnalysisConfig,
  AnalysisStrategyConfig,
  AnalysisRuntime,
  AnalysisStrategy,
  AnalysisResponse,
} from './analysis/types';
export type { QueryLanguage, TranslationResult, QueryDialect } from './query/types';
export type { JsonValue, Properties } from './contracts/json';
export type {
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
} from './contracts/data-model';
export type { SchemaOptions, SemanticOptions, Schema } from './contracts/schema';
export type {
  LogicalType,
  MetricId,
  MetricConfig,
  ProfileOptions,
  ParsedProfileOptions,
  Profile,
} from './contracts/profile';
export type { MetricOption, Metric } from './util/profile';
export type { ExecutionOptions, ExecutionResult, QueryColumn } from './contracts/result';
export type { ChartSpec, VisualizeResponse, ChartType } from './contracts/chart';
export type { ChartConfig, ChartTypeDefinition } from './visualization/types';
export type { SuggestResult } from './suggest/index';
export type { ExcelSheetOptions, ExcelReadOptions } from './contracts/excel';
export type {
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
} from './contracts/source';
