/** Runtime contracts and data types without engine registration or model dependencies. */
export { sourceConfigSchema } from './contracts/source';
export { schemaMetadataSchema } from './contracts/schema';
export { profileMetadataSchema } from './contracts/profile';
export { semanticMetadataSchema } from './contracts/semantic';
export { dataModelMetadataSchema } from './contracts/shared/data-model';
export { executionResultSchema } from './contracts/query';
export { chartSpecSchema, bindingSchema } from './contracts/visualize';

export type {
  DataSourceConfig,
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
} from './contracts/source';
export type { ExcelSheetOptions, ExcelReadOptions } from './contracts/source/excel';
export type { Schema, SchemaOptions } from './contracts/schema';
export type {
  Profile,
  ProfileOptions,
  ParsedProfileOptions,
  MetricConfig,
  MetricId,
  LogicalType,
} from './contracts/profile';
export type { Semantic, SemanticOptions } from './contracts/semantic';
export type {
  DataModel,
  Model,
  Column,
  TableReference,
  PrimaryKey,
  Relationship,
  JoinType,
  View,
  Cube,
  Measure,
  CubeDimension,
  TimeDimension,
} from './contracts/shared/data-model';
export type { JsonValue, Properties } from './contracts/shared/json';
export type { ExecutionResult, ExecutionOptions, QueryColumn } from './contracts/query';
export type { AnalysisConfig, AnalysisResponse, AnalysisStrategyConfig } from './contracts/analyze';
export type { SuggestResult } from './contracts/suggest';
export type { ChartSpec, ChartSpecInput, ChartType, ChartDataBinding, VisualizeResponse } from './contracts/visualize';
