/** Public type definitions, inferred from runtime schemas where applicable. */
import type { z } from 'zod';
import type { LanguageModel, LanguageModelUsage } from 'ai';
import type { AnalysisEvent } from './event';
import type {
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
  suggestOutputSchema,
  visualizeOutputSchema,
  vizInputSchema,
} from './contracts';
import type { csvReadOptionsSchema } from './contracts/source/csv';
import type { jsonReadOptionsSchema } from './contracts/source/json';
import type { excelSheetSchema } from './contracts/source/excel';
import type { dataModelStructure } from './contracts/shared/data-model';
import type { jsonValue } from './contracts/shared/json';

/**
 * LLM configuration
 */
export interface LLMConfig {
  /** Defaults to OpenAI-compatible Chat Completions. Gateway reads AI_GATEWAY_API_KEY. */
  provider?: 'openai' | 'gateway';
  /** Model name or a preconfigured AI SDK model instance. */
  model: string | LanguageModel;
  /** API key for the LLM provider */
  apiKey?: string;
  /** Optional API base URL */
  baseURL?: string;
  /** Maximum retries for retryable model API failures. Default 3. */
  maxRetries?: number;
}

/**
 * AVA configuration
 */
export interface AVAConfig {
  /** LLM configuration */
  llm: LLMConfig;
  /** Engine selection and options (defaults to the DuckDB engine when omitted) */
  engine?: EngineConfig;
}

// Data contracts keep input defaults optional and normalized outputs explicit.
export type SchemaOptions = z.input<typeof schemaInputSchema>;
export type Schema = z.output<typeof schemaOutputSchema>;
export type ProfileOptions = z.input<typeof profileInputSchema>;
export type Profile = z.output<typeof profileOutputSchema>;
export type SemanticOptions = z.input<typeof semanticInputSchema>;
export type Semantic = z.output<typeof semanticOutputSchema>;
export type ExecutionOptions = NonNullable<z.input<typeof queryInputSchema>['options']>;
export type QueryColumn = z.output<typeof queryOutputSchema>['schema'][number];
export type ExecutionResult<T = Record<string, unknown>> = Omit<
  z.output<ReturnType<typeof queryOutputSchema.strip>>,
  'data'
> & {
  data: T[];
};
export type AnalysisConfig = NonNullable<z.input<typeof analyzeInputSchema>['config']>;
export type AnalysisStrategyConfig = NonNullable<AnalysisConfig['strategy']>;
export type AnalysisResponse<T = Record<string, unknown>> = Omit<
  z.output<ReturnType<typeof analyzeOutputSchema.strip>>,
  'data'
> & {
  data: T[];
};
export type SuggestResult = z.output<typeof suggestOutputSchema>[number];
export type ChartSpec = z.output<typeof vizInputSchema>;
export type ChartSpecInput = z.input<typeof vizInputSchema>;
export type ChartType = ChartSpec['chartType'];
export type VisualizeResponse = NonNullable<z.output<typeof visualizeOutputSchema>>;
export type LogicalType = Profile['models'][number]['columns'][number]['properties']['logicalType'];
export type MetricConfig = NonNullable<ProfileOptions['metrics']>[number];
export type MetricId = Exclude<MetricConfig, string>['id'];
export type ParsedProfileOptions = { metrics: Exclude<MetricConfig, string>[] };

export type JsonValue = z.output<typeof jsonValue>;
export type Properties = Record<string, JsonValue>;
export type DataModel = z.output<typeof dataModelStructure>;
export type Model = NonNullable<DataModel['models']>[number];
export type Column = NonNullable<Model['columns']>[number];
export type TableReference = NonNullable<Model['tableReference']>;
export type PrimaryKey = NonNullable<Model['primaryKey']>;
export type Relationship = NonNullable<DataModel['relationships']>[number];
export type JoinType = Relationship['joinType'];
export type View = NonNullable<DataModel['views']>[number];
export type Cube = NonNullable<DataModel['cubes']>[number];
export type Measure = Cube['measures'][number];
export type CubeDimension = Measure;
export type TimeDimension = CubeDimension;

export type DataSourceConfig = z.input<typeof sourceInputSchema>;
export type ParsedDataSourceConfig = z.output<typeof sourceInputSchema> & { name: string };
export type DataSourceOptions<T extends DataSourceConfig['type']> = Extract<DataSourceConfig, { type: T }>['options'];

export type CSVFileSourceOptions = DataSourceOptions<'csv-file'>;
export type JsonFileSourceOptions = DataSourceOptions<'json-file'>;
export type ParquetSourceOptions = DataSourceOptions<'parquet'>;
export type ExcelSourceOptions = DataSourceOptions<'excel'>;
export type SQLiteSourceOptions = DataSourceOptions<'sqlite'>;
export type CSVSourceOptions = DataSourceOptions<'csv'>;
export type JsonSourceOptions = DataSourceOptions<'json'>;
export type TextSourceOptions = DataSourceOptions<'text'>;
export type MySQLSourceOptions = DataSourceOptions<'mysql'>;
export type MongoDBSourceOptions = DataSourceOptions<'mongodb'>;
export type PostgreSQLSourceOptions = DataSourceOptions<'postgresql'>;
export type SupabaseSourceOptions = DataSourceOptions<'supabase'>;
export type ClickHouseSourceOptions = DataSourceOptions<'clickhouse'>;
export type SQLServerSourceOptions = DataSourceOptions<'sqlserver'>;
export type SnowflakeSourceOptions = DataSourceOptions<'snowflake'>;
export type FeishuBitableSourceOptions = DataSourceOptions<'feishu-bitable'>;
export type GitHubSourceOptions = DataSourceOptions<'github'>;

export type CSVReadOptions = z.input<typeof csvReadOptionsSchema>;
export type JSONReadOptions = z.input<typeof jsonReadOptionsSchema>;
export type ExcelSheetOptions = z.input<typeof excelSheetSchema>;
export type ExcelReadOptions = Omit<ExcelSheetOptions, 'sheet'>;
export type SSHOptions = NonNullable<MySQLSourceOptions['ssh']>;

/**
 * Minimal structural type for a database connection used by LoadedSource.
 * Matches the subset of @duckdb/node-api's DuckDBConnection that loaders use,
 * declared here so the shared types never import the Node-only package.
 */
export interface DuckDBConnection {
  run(sql: string, values?: string[]): Promise<unknown>;
  runAndReadAll(sql: string): Promise<{ getRowObjectsJson(): Record<string, unknown>[] }>;
}

/**
 * DuckDB engine resource limits and query timeout. All optional; the engine
 * applies secure defaults (512MB memory, 1 thread, 30s query timeout) so a
 * runaway LLM-generated query cannot exhaust the host's memory/CPU/disk.
 */
export interface DuckDBEngineOptions {
  /** Memory limit, e.g. '512MB'. Default '512MB'. */
  memoryLimit?: string;
  /** Number of worker threads. Default 1. */
  threads?: number;
  /** Max size of the spill (temp) directory, e.g. '1GB'. Unset = unlimited. */
  maxTempDirectorySize?: string;
  /** Per-query timeout in milliseconds. Default 30000. */
  queryTimeoutMs?: number;
  /** Allow DuckDB community extensions during source loading when explicitly needed. */
  allowCommunityExtensions?: boolean;
}

/**
 * File formats readable by DuckDB's readers (csv-file maps to csv, json-file to json).
 */
export type FileFormat = 'csv' | 'json' | 'parquet';

/**
 * A loaded data source, ready for an engine to register as one or more views.
 * File loaders register a single `data` view; database loaders ATTACH and
 * register one view per discovered table.
 */
export interface LoadedSource {
  /**
   * Register tables or views in the given DuckDB schema and return their names.
   */
  register: (conn: DuckDBConnection, namespace?: string) => Promise<string[]>;
  /**
   * Describe the source using its exposed table references.
   */
  getSchema: (conn: DuckDBConnection, namespace?: string) => Promise<Schema>;
  /**
   * Exact files the engine allows after registering (empty for sources without local files).
   */
  allowedPaths: string[];
  /** Release resources (temp files, attached databases, tunnels) */
  cleanup: () => Promise<void>;
}

/**
 * Python engine options.
 */
export interface PythonEngineOptions {
  /**
   * Override local python3 execution with a custom environment. Local execution is not sandboxed.
   * Run the complete Python script and return its JSON output as ExecutionResult.
   * Each query first sends a compile-only validation script, then the source-loading and result script.
   * Configure remote execution deadlines separately.
   */
  execute?: (code: string) => Promise<ExecutionResult>;
  /** Wait and local process deadline for each validation or execution call. Default 30000 ms. */
  queryTimeoutMs?: number;
}

/** Constructor signature every engine class must satisfy. */
export type EngineClass = new (llmConfig: LLMConfig, options?: Record<string, unknown>) => AnalysisEngine;

/**
 * Engine selection and per-engine options. The `type` discriminant picks the
 * analysis engine; the remaining fields are the options for that engine.
 * External SDK engines use their registered name and validate their own options.
 * Python defaults to local python3 execution; callers can supply their own execution environment.
 */
export type EngineConfig =
  | ({ type: 'duckdb' } & DuckDBEngineOptions)
  | ({ type: 'python' } & PythonEngineOptions)
  | { type: 'javascript' }
  | { type: 'supabase' }
  | { type: 'clickhouse' }
  | { type: 'sqlserver' }
  | { type: 'snowflake' }
  | { type: string; [option: string]: unknown };

/**
 * An analysis engine: loads a data source, turns natural-language queries
 * into its executable DSL (SQL) via LLM, and executes it.
 * Currently implemented by DuckDBEngine (duckdb/); kept as an interface
 * to allow alternative engines in the future.
 */
export interface AnalysisEngine {
  /** Query language, generation rules and validation supplied by every engine. */
  readonly dialect: QueryDialect;
  /**
   * Prepare the supplied source configurations for execution.
   */
  load(configs: DataSourceConfig | DataSourceConfig[]): Promise<void>;
  /** Discover the loaded source structure. */
  schema(): Promise<Schema>;
  /** Compute statistics for the loaded data. */
  profile?(schema: Schema, options?: ProfileOptions): Promise<Profile>;
  /** Generate the executable DSL (SQL) for a natural-language query */
  getDSL(query: string, dataModel: DataModel): Promise<TranslationResult>;
  /** Execute one DSL statement with a bounded result. */
  execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>>;
  /** Release resources (temp files, database connections) */
  dispose(): Promise<void>;
}

/** Execution language id exposed by a query dialect. */
export type QueryLanguage = string;

/** Executable DSL and its model usage, when available. */
export interface TranslationResult {
  dsl: string;
  usage?: LanguageModelUsage;
}

/**
 * Generates and validates code for one query language.
 */
export interface QueryDialect {
  readonly id: string;
  /** Language rules and execution bindings, independent of the model response format. */
  readonly rules: string;
  /** Generate executable code for a natural-language query. */
  getDSL(query: string, dataModel: DataModel): Promise<TranslationResult>;
  /** Validate the DSL without executing it, preserving its source semantics. */
  validateDSL(dsl: string): Promise<string>;
}

/** Runtime dependencies available to an analysis strategy. */
export interface AnalysisRuntime {
  /** Dispatch an analysis stage event. */
  emit: (event: AnalysisEvent) => void;
  dataModel: DataModel;
  engine: AnalysisEngine;
  llm: LLMConfig;
}

/** A replaceable way of analyzing a natural-language query. */
export type AnalysisStrategy = (
  query: string,
  config: AnalysisConfig,
  runtime: AnalysisRuntime
) => Promise<AnalysisResponse>;

/**
 * GPT-Vis JSON config
 */
export type ChartConfig = ChartSpec['config'];

/**
 * Chart type definition — structured metadata for prompt generation
 */
export interface ChartTypeDefinition {
  /** Chart type identifier */
  type: ChartType;
  /** Chinese name */
  name: string;
  /** Feature descriptions */
  features: string[];
  /** Applicable use cases */
  useCases: string[];
  /** Data requirements */
  dataRequirements: string[];
  /** Limitations / inapplicable scenarios */
  limitations: string[];
}

/**
 * The rules for one metric option.
 */
export type MetricOption = {
  /** Throws if the value is not allowed. */
  validate(value: unknown): void;
};

/**
 * A metric, its rules, and its engine-specific implementation.
 */
export type Metric<Expression = unknown> = {
  /** The metric name. */
  id: MetricId;
  /** The implementation interpreted by the registered engine. */
  expression: Expression;
  /** Returns true if the metric applies to this target. */
  enable: (context: {
    /** The kind of target to check. */
    target: 'table' | 'column';
    /** Field details for a column target. */
    field?: {
      /** The field type shared by all engines. */
      logicalType: LogicalType;
    };
  }) => boolean;
  /** Option rules keyed by option name. */
  options?: Record<string, MetricOption>;
};

export type { JavaScriptEngine } from './interpreter/javascript';
