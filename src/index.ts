/**
 * AVA v4 - A framework for AI-native Visual Analytics
 *
 * Main entry point
 */
export { AVA } from './ava';

export type {
  AVAConfig,
  LLMConfig,
  SourceType,
  FileFormat,
  LoadedSource,
  DataSourceConfig,
  FileSourceOptions,
  ObjectSourceOptions,
  URLSourceOptions,
  TextSourceOptions,
  CSVSourceOptions,
  AnalysisEngine,
  AnalysisResponse,
  VisualizeResponse,
  DatasetInfo,
  FieldMetadata,
  ChartType,
  ChartTypeDefinition,
  SuggestResult,
} from './types';
export { extractMetadata, formatDatasetInfo } from './duckdb';
