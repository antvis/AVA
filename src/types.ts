/**
 * Core type definitions for AVA v4
 */

import type { LanguageModel, LanguageModelUsage } from 'ai';
import type { AnalysisEvent } from './event';
import type { DataSourceConfig } from './contracts/source';
import type { ExecutionResult } from './contracts/result';

/**
 * Minimal structural type for a database connection used by LoadedSource.
 * Matches the subset of @duckdb/node-api's DuckDBConnection that loaders use,
 * declared here so the shared types never import the Node-only package.
 */
export interface DuckDBConnection {
  run(sql: string): Promise<unknown>;
  runAndReadAll(sql: string): Promise<{ getRowObjectsJson(): Record<string, unknown>[] }>;
}

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
  | { type: string; [option: string]: unknown };

/**
 * AVA configuration
 */
export interface AVAConfig {
  /** LLM configuration */
  llm: LLMConfig;
  /** Engine selection and options (defaults to the DuckDB engine when omitted) */
  engine?: EngineConfig;
}

/** Per-analysis options. */
export interface AnalysisConfig extends ExecutionOptions {
  /** Include a natural-language summary. Defaults to true; false returns empty text. */
  includeSummary?: boolean;
  /** Strategy for this analysis (defaults to direct). */
  strategy?: AnalysisStrategyConfig;
}

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
  ExcelSheetOptions,
  ExcelReadOptions,
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
  DataSourceConfig,
} from './contracts/source';
export type { ExecutionResult, QueryColumn } from './contracts/result';

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
  /** Register the source's table(s)/view(s) and return their exposed names. */
  register: (conn: DuckDBConnection) => Promise<string[]>;
  /** */
  getSchema: (conn: DuckDBConnection) => Promise<Schema>;
  /**
   * Exact files the engine allows after registering (empty for sources without local files).
   */
  allowedPaths: string[];
  /** Release resources (temp files, attached databases, tunnels) */
  cleanup: () => Promise<void>;
}

/**
 * A field type shared by all engines.
 */
export type LogicalType = 'numeric' | 'string' | 'boolean' | 'date' | 'unknown';

/**
 * The name used to register and select a metric.
 */
export type MetricId = string;

/**
 * The rules for one metric option.
 */
export type MetricOption = {
  /** Throws if the value is not allowed. */
  validate(value: number): void;
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

/**
 * A selected metric, with optional values.
 */
export type MetricConfig =
  | MetricId
  | {
      /** The metric name. */
      id: MetricId;
      /** Option values checked against the metric rules. The id key is reserved. */
      [name: string]: unknown;
    };

/** Schema discovery currently has no configurable options. */
export type SchemaOptions = Record<string, never>;

/** Semantic metadata currently has no configurable options. */
export type SemanticOptions = Record<string, never>;

/**
 * Options for a profile run.
 */
export interface ProfileOptions {
  /** Metrics to compute. Uses the default set if omitted. */
  metrics?: MetricConfig[];
}

/**
 * Checked options ready for an engine to use.
 */
export interface ParsedProfileOptions {
  /** Checked metric configs with defaults filled in. */
  metrics: Exclude<MetricConfig, string>[];
}

/** Execution language id exposed by a query dialect. */
export type QueryLanguage = string;

/** Executable DSL and its model usage, when available. */
export interface TranslationResult {
  dsl: string;
  usage?: LanguageModelUsage;
}

/**
 * An analysis engine: loads a data source, turns natural-language queries
 * into its executable DSL (SQL) via LLM, and executes it.
 * Currently implemented by DuckDBEngine (duckdb/); kept as an interface
 * to allow alternative engines in the future.
 */
export interface AnalysisEngine {
  /** Query language, generation rules and validation supplied by every engine. */
  readonly dialect: QueryDialect;
  /** Load a data source and prepare it for execution. */
  load(config: DataSourceConfig): Promise<void>;
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

/** Controls the maximum size of a bounded execution result. */
export interface ExecutionOptions {
  /** Maximum rows returned. Default 200; hard limit 1,000,000. */
  maxRows?: number;
  /** Maximum serialized UTF-8 bytes returned. Default 1 MiB. */
  maxResultBytes?: number;
}

/** Built-in analysis strategies. */
export type AnalysisStrategyConfig =
  | {
      type: 'direct';
      /** Execution correction retries after the initial attempt. defaults to 2. */
      maxRetries?: number;
    }
  | { type: 'loop'; maxSteps?: number };

/** Unified data structure, profiling results and semantics for AVA. */

/** Serializable metadata values; numeric finiteness must be checked at runtime. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Extensible metadata whose keys and meanings are agreed on by producers and consumers. */
export type Properties = Record<string, JsonValue>;

export interface Column {
  /** Name exposed within the model; expressions can map it to a different source field. */
  name: string;
  /** Declared data type, or the target model name for a relationship column. */
  type: string;
  /** Name of the Relationship used for model navigation; not a foreign-key column name. */
  relationship?: string;
  /** Marks a column derived from an expression; execution is the engine's responsibility. */
  isCalculated?: boolean;
  /** Marks this column as part of the model's declared primary key. */
  isPrimaryKey?: boolean;
  /** Declared non-null constraint; omission is unspecified, not inferred from observed null counts. */
  notNull?: boolean;
  /** SQL mapping or calculation over the model source; null or omission supplies no expression. */
  expression?: string | null;
  /**
   * Column observations keyed by metric name, e.g. null_count or min.
   * Missing means uncomputed/omitted; null means no usable aggregate; zero and [] are actual results.
   */
  metrics?: Record<string, JsonValue>;
  /** Column-level context such as descriptions or units; statistical results belong in metrics. */
  properties?: Properties;
}

export interface TableReference {
  /** Source catalog/database qualifier; omission leaves resolution to the execution context. */
  catalog?: string;
  /** Source schema qualifier; omission leaves resolution to the execution context. */
  schema?: string;
  /** Source table or view identifier, independent of the logical Model.name. */
  table: string;
  /** Source-specific attributes; consumers must validate their values before use. */
  [key: string]: unknown;
}

/** A single column or a nonempty, ordered composite key. */
export type PrimaryKey = string | [string, ...string[]];

/** Exactly one of refSql, baseObject or tableReference identifies the source. */
export type Model = {
  /** Logical dataset name referenced by relationships, base objects and modeled queries. */
  name: string;
  /** Exposed physical, calculated and relationship columns; omission does not describe a zero-column source. */
  columns?: Column[];
  /** Declared row identifier; observed uniqueness alone does not establish a primary key. */
  primaryKey?: PrimaryKey;
  /** Alternative unique column sets; each array is one composite key, not several independent keys. */
  uniqueKeys?: PrimaryKey[];
  /** SQL dialect of refSql; omission uses the execution context's dialect. */
  dialect?: string;
  /**
   * Model-wide observations keyed by metric name, e.g. row_count.
   * Missing means uncomputed/omitted; null means no usable aggregate; zero and [] are actual results.
   */
  metrics?: Record<string, JsonValue>;
  /** Model-level context such as business descriptions or source annotations. */
  properties?: Properties;
} & ModelSource;

type ModelSource =
  | {
      /** SQL defining the model's source rows, before its column mappings and calculations. */
      refSql: string;
      /** Excluded when the source is SQL. */
      baseObject?: never;
      /** Excluded when the source is SQL. */
      tableReference?: never;
    }
  | {
      /** Excluded when the source is another modeled object. */
      refSql?: never;
      /** Name of the model or view supplying this model's source rows. */
      baseObject: string;
      /** Excluded when the source is another modeled object. */
      tableReference?: never;
    }
  | {
      /** Excluded when the source is a physical table reference. */
      refSql?: never;
      /** Excluded when the source is a physical table reference. */
      baseObject?: never;
      /** Physical table or view to resolve through the engine's connection. */
      tableReference: TableReference;
    };

/** Relationship cardinality, not a SQL join operator such as LEFT or INNER. */
export type JoinType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

export interface Relationship {
  /** Relationship identifier referenced by Column.relationship; distinguishes multiple joins between models. */
  name: string;
  /** Ordered model names; joinType describes the first model relative to the second. */
  models: [string, string];
  /** Declared relationship cardinality; does not select INNER/LEFT JOIN or derive from a data sample. */
  joinType: JoinType;
  /** SQL join predicate with qualified columns; composite relationships must include every column pair. */
  condition: string;
  /** Context for interpreting the relationship, such as its business meaning or declaration source. */
  properties?: Properties;
  /** Additional attributes with consumer-defined meaning; validate unknown values before use. */
  [key: string]: unknown;
}

export interface View {
  /** Logical name used to reference this reusable query. */
  name: string;
  /** SQL defining the view's result; declaring it here does not execute or materialize it. */
  statement: string;
  /** SQL dialect of the statement; omission uses the execution context's dialect. */
  dialect?: string;
  /** Context describing the view's purpose or business conventions. */
  properties?: Properties;
  /** Additional attributes with consumer-defined meaning; validate unknown values before use. */
  [key: string]: unknown;
}

/** A reusable aggregation, separate from observed profiling metrics. */
export interface Measure extends Pick<Column, 'name' | 'type' | 'properties'> {
  /** SQL aggregation over the cube's base object, e.g. SUM(amount). */
  expression: string;
  description?: string;
}

/** A grouping expression over a cube's base object. */
export type CubeDimension = Measure;

/** A date/time grouping expression; granularity is chosen at query time. */
export type TimeDimension = CubeDimension;

/** A semantic aggregation over a model or view. */
export interface Cube {
  name: string;
  /** Name of the model or view supplying the rows to aggregate. */
  baseObject: string;
  measures: [Measure, ...Measure[]];
  dimensions?: CubeDimension[];
  timeDimensions?: TimeDimension[];
  /** Ordered dimension names from coarsest to finest for each drill-down path. */
  hierarchies?: Record<string, [string, ...string[]]>;
  properties?: Properties;
}

/** Schema, profiling and semantics enrich the same data model. */
export interface DataModel {
  description?: string;
  /** Context shared across models; per-model and per-column metadata stays with its owning object. */
  properties?: Properties;
  /** Logical datasets, source mappings, columns and their computed observations. */
  models?: Model[];
  /** Declared joins between models; omission provides no evidence that models are unrelated. */
  relationships?: Relationship[];
  /** Reusable named queries; discovering a database view does not automatically supply its SQL definition. */
  views?: View[];
  /** Reusable business aggregations, dimensions and drill-down paths. */
  cubes?: Cube[];
}

/** Business definitions supplied independently of catalog discovery and profiling observations. */
export interface Semantic extends Pick<DataModel, 'description' | 'properties' | 'relationships' | 'views' | 'cubes'> {
  models?: (Omit<Model, 'columns' | 'metrics'> &
    ModelSource & {
      columns?: Omit<Column, 'metrics'>[];
    })[];
}

/** Catalog-discoverable structure; excludes observations and application-defined semantics. */
export interface Schema extends Pick<DataModel, 'models' | 'relationships' | 'views'> {
  /** Physical tables and views with their catalog identity, exposed columns and declared unique keys. */
  models: (Pick<Model, 'name' | 'primaryKey' | 'uniqueKeys'> & {
    /** Source identity; catalog and schema are included when the engine exposes them. */
    tableReference: Pick<TableReference, 'catalog' | 'schema' | 'table'>;
    /** Catalog-reported types and nullability; no inferred business roles or calculation expressions. */
    columns: Pick<Column, 'name' | 'type' | 'notNull'>[];
  })[];
  /** Foreign-key joins; include only when both endpoints are exposed and key constraints establish cardinality. */
  relationships?: (Pick<Relationship, 'name' | 'models' | 'condition'> & {
    /** Referencing model first; uniqueness of its foreign-key columns determines one-to-one versus many-to-one. */
    joinType: Extract<JoinType, 'ONE_TO_ONE' | 'MANY_TO_ONE'>;
  })[];
  /** Named view queries; extract the query body from catalog DDL before assigning statement. */
  views?: Pick<View, 'name' | 'statement'>[];
}

/** Observations matched to DataModel by model and column names, independently of structural discovery. */
export interface Profile {
  /** Model names identify the existing objects to enrich with observations. */
  models: (Pick<Model, 'name'> & {
    /** Model observations; an empty object means no model-level results were produced. */
    metrics: NonNullable<Model['metrics']>;
    /** Column names are resolved within the enclosing model. */
    columns: (Pick<Column, 'name'> & {
      /** Column observations; absent metric keys differ from null, zero and empty-array results. */
      metrics: NonNullable<Column['metrics']>;
      /** Profiling annotations needed to interpret engine-specific values. */
      properties: {
        /** Normalized value category; date bounds use Unix milliseconds and unknown preserves unsupported types. */
        logicalType: 'numeric' | 'string' | 'boolean' | 'date' | 'unknown';
      };
    })[];
  })[];
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

/**
 * Analysis response — data analysis results only (no visualization)
 */
export interface AnalysisResponse<T = Record<string, unknown>> extends ExecutionResult<T> {
  /** The original user query */
  query: string;
  /** The analysis result as text; empty when includeSummary is false. */
  text: string;
  /** Optional markdown content */
  markdown?: string;
  /** The SQL executed for the analysis */
  sql?: string;
}

/**
 * GPT-Vis JSON config
 */
export type ChartConfig = { type: string; [key: string]: unknown };

/**
 * Chart specification for rendering.
 */
export type ChartSpec = import('zod').infer<typeof import('./contracts/chart').chartSpecSchema>;

/** Standalone chart generation result. */
export type VisualizeResponse = ChartSpec & { html: string };

/**
 * Supported chart types from GPT-Vis
 */
export type ChartType = ChartSpec['chartType'];

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
 * Result of a suggested query
 */
export interface SuggestResult {
  /** The suggested query string */
  query: string;
  /** Score between 0-1 indicating meaningfulness */
  score: number;
  /** Reason for the score */
  reason: string;
}
