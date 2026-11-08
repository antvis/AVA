/** Shared contracts; consumers outside this directory import through this entry. */
export { sourceConfigSchema, sourceSchemas, sourceInputSchema } from './source';
export { csvReadOptionsSchema } from './source/csv';
export { jsonReadOptionsSchema } from './source/json';
export { excelOptionsSchema, excelSheetSchema } from './source/excel';
export { schemaMetadataSchema, schemaStructure, schemaInputSchema, schemaOutputSchema } from './schema';
export { profileMetadataSchema, profileInputSchema, profileOutputSchema } from './profile';
export { semanticMetadataSchema, semanticInputSchema, semanticOutputSchema } from './semantic';
export { dataModelMetadataSchema } from './shared/data-model';
export { executionResultSchema, queryInputSchema, queryOutputSchema } from './query';
export {
  chartSpecSchema,
  bindingSchema,
  recommendInputSchema,
  recommendOutputSchema,
  visualizeInputSchema,
  visualizeOutputSchema,
  vizInputSchema,
  vizOutputSchema,
} from './visualize';
export { jsonValue, dataRowSchema } from './shared/json';
export { analyzeInputSchema, analyzeOutputSchema } from './analyze';
export { translateInputSchema, translateOutputSchema } from './translate';
export { suggestInputSchema, suggestOutputSchema } from './suggest';

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
  SourceInput,
} from './source';
export type { ExcelSheetOptions, ExcelReadOptions } from './source/excel';
export type { Schema, SchemaOptions, SchemaInput, SchemaOutput } from './schema';
export type {
  Profile,
  ProfileOptions,
  ParsedProfileOptions,
  MetricConfig,
  MetricId,
  LogicalType,
  ProfileInput,
  ProfileOutput,
} from './profile';
export type { Semantic, SemanticOptions, SemanticInput, SemanticOutput } from './semantic';
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
export type { ExecutionResult, ExecutionOptions, QueryColumn, QueryInput, QueryOutput } from './query';
export type { AnalysisConfig, AnalysisResponse, AnalysisStrategyConfig, AnalyzeInput, AnalyzeOutput } from './analyze';
export type { SuggestResult, SuggestInput, SuggestOutput } from './suggest';
export type {
  ChartSpec,
  ChartSpecInput,
  ChartType,
  ChartDataBinding,
  VisualizeResponse,
  RecommendInput,
  RecommendOutput,
  VisualizeInput,
  VisualizeOutput,
  VizInput,
  VizOutput,
} from './visualize';
export type { TranslateInput, TranslateOutput } from './translate';
