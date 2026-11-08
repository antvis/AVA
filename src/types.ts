/** Compatibility exports; definitions live with their contracts or owning module. */

export type { LLMConfig, AVAConfig } from './config';
export type { DuckDBConnection, DuckDBEngineOptions, FileFormat, LoadedSource } from './duckdb/types';
export type { PythonEngineOptions } from './interpreter/python/types';
export type { EngineConfig, AnalysisEngine } from './engines';
export type { AnalysisConfig, AnalysisStrategyConfig, AnalysisResponse } from './contracts/analyze';
export type { AnalysisRuntime, AnalysisStrategy } from './analysis/types';
export type { QueryLanguage, TranslationResult, QueryDialect } from './query/types';
export type { JsonValue, Properties } from './contracts/shared/json';
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
} from './contracts/shared/data-model';
export type { Semantic, SemanticOptions } from './contracts/semantic';
export type { SchemaOptions, Schema } from './contracts/schema';
export type {
  LogicalType,
  MetricId,
  MetricConfig,
  ProfileOptions,
  ParsedProfileOptions,
  Profile,
} from './contracts/profile';
export type { MetricOption, Metric } from './util/profile';
export type { ExecutionOptions, ExecutionResult, QueryColumn } from './contracts/query';
export type { ChartSpec, ChartSpecInput, VisualizeResponse, ChartType } from './contracts/visualize';
export type { ChartConfig, ChartTypeDefinition } from './visualization/types';
export type { SuggestResult } from './contracts/suggest';
export type { ExcelSheetOptions, ExcelReadOptions } from './contracts/source/excel';
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
