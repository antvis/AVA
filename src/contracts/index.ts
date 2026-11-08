/** Shared data contracts for SDK, CLI and integration consumers. */
export { sourceConfigSchema, sourceSchemas } from './source';
export { csvReadOptionsSchema } from './source/csv';
export { jsonReadOptionsSchema } from './source/json';
export { excelOptionsSchema, excelSheetSchema } from './source/excel';
export { schemaMetadataSchema, schemaStructure } from './schema';
export { profileMetadataSchema } from './profile';
export { semanticMetadataSchema } from './semantic';
export { dataModelMetadataSchema } from './shared/data-model';
export { executionResultSchema } from './query';
export { chartSpecSchema, bindingSchema } from './visualize';
export { jsonValue, dataRowSchema } from './shared/json';

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
} from './source';
export type { ExcelSheetOptions, ExcelReadOptions } from './source/excel';
export type { Schema, SchemaOptions } from './schema';
export type { Profile, ProfileOptions, ParsedProfileOptions, MetricConfig, MetricId, LogicalType } from './profile';
export type { Semantic, SemanticOptions } from './semantic';
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
} from './shared/data-model';
export type { JsonValue, Properties } from './shared/json';
export type { ExecutionResult, ExecutionOptions, QueryColumn } from './query';
export type { AnalysisConfig, AnalysisResponse, AnalysisStrategyConfig } from './analyze';
export type { SuggestResult } from './suggest';
export type { ChartSpec, ChartSpecInput, ChartType, ChartDataBinding, VisualizeResponse } from './visualize';
