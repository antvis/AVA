/**
 * Core type definitions for AVA v4
 */

import type { LanguageModelUsage } from 'ai';

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
  /** Model name (e.g., 'gpt-4', 'gpt-3.5-turbo') */
  model: string;
  /** API key for the LLM provider */
  apiKey?: string;
  /** Optional API base URL */
  baseURL?: string;
  /** Maximum retries for retryable model API failures. Default 3. */
  maxRetries?: number;
  /** Optional callback for SQL-generation token usage */
  onQueryUsage?: (usage: LanguageModelUsage) => void;
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
}

/**
 * Engine selection and per-engine options. The `type` discriminant picks the
 * analysis engine; the remaining fields are the options for that engine.
 * Currently only the DuckDB engine has configurable options.
 */
export type EngineConfig = ({ type: 'duckdb' } & DuckDBEngineOptions) | { type: 'interpreter' } | { type: 'supabase' };

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

/**
 * Data source types for load.
 * - inline types: `csv` (content string), `json` (object array), `text`
 * - file types: `csv-file`, `json-file`, `parquet` (read through DuckDB's readers)
 * - database types: `mysql`, `postgresql`, `sqlite` (ATTACH through DuckDB's extension)
 * - cloud types: `supabase` (schema discovered and SQL executed through the Supabase Management API — data never leaves the SaaS; handled by SaasDBEngine)
 */
export type SourceType =
  | 'csv'
  | 'json'
  | 'text'
  | 'csv-file'
  | 'json-file'
  | 'parquet'
  | 'excel'
  | 'mysql'
  | 'postgresql'
  | 'sqlite'
  | 'supabase';

/**
 * DuckDB read_csv reader options.
 * Mirrors the Parameters table in
 * https://duckdb.org/docs/stable/data/csv/overview.html
 * Type mapping: BOOL→boolean, BIGINT→number, VARCHAR→string,
 * VARCHAR[]→string[], STRUCT→Record<string, string>, TYPE[]→string[].
 * All fields optional; unset fields fall back to the reader default / sniffer.
 * Only the primary name of aliased options is kept (delim, not sep/delimiter).
 */
export interface CSVReadOptions {
  // ── structure / columns ─────────────────────
  /** First line of each file contains the column names. Default false */
  header?: boolean;
  /** Column names, as a list */
  names?: string[];
  /** Column names → types struct, e.g. { col1: 'INTEGER' }. Disables schema auto-detection */
  columns?: Record<string, string>;
  /** Column types, by position (list) or by name (struct) */
  types?: string[] | Record<string, string>;
  /** Skip type detection and read all columns as VARCHAR. Default false */
  all_varchar?: boolean;
  /** Remove non-alphanumeric chars from column names; prefix reserved keywords with _ */
  normalize_names?: boolean;
  /** Columns that must not be matched against the NULL string */
  force_not_null?: string[];

  // ── delimiter / quoting ─────────────────────
  /** Field delimiter (up to 4 bytes). Default ',' */
  delim?: string;
  /** Quote character. Default '"' */
  quote?: string;
  /** Escape character for the quote within quoted values. Default '"' */
  escape?: string;
  /** Character used to initiate comments */
  comment?: string;
  /** New line character(s): '\r' | '\n' | '\r\n' */
  new_line?: string;

  // ── type detection / formats ────────────────
  /** Auto detect CSV parameters. Default true */
  auto_detect?: boolean;
  /** Types the sniffer considers when detecting column types, e.g. ['BIGINT', 'DATE'] */
  auto_type_candidates?: string[];
  /** Date format used when parsing dates */
  dateformat?: string;
  /** Timestamp format used when parsing timestamps */
  timestampformat?: string;
  /** Decimal separator for numbers. Default '.' */
  decimal_separator?: string;
  /** Thousands separator (single char, different from decimal_separator) */
  thousands?: string;
  /** String(s) that represent a NULL value */
  nullstr?: string | string[];
  /** Allow the conversion of quoted values to NULL. Default true */
  allow_quoted_nulls?: boolean;

  // ── sampling / performance ──────────────────
  /** Number of sample lines for auto detection. Default 20480 */
  sample_size?: number;
  /** Size of the read buffers in bytes. Default 16 * max_line_size */
  buffer_size?: number;
  /** Files used by the sniffer for multi-file schema detection; -1 = all. Default 10 */
  files_to_sniff?: number;
  /** Maximum line size in bytes. Default 2000000 */
  max_line_size?: number;
  /** Use the parallel CSV reader. Default true */
  parallel?: boolean;
  /** Number of lines to skip at the start of each file. Default 0 */
  skip?: number;

  // ── error handling / rejects ────────────────
  /** Ignore any parsing errors encountered. Default false */
  ignore_errors?: boolean;
  /** Pad short rows with NULL values on the right. Default false */
  null_padding?: boolean;
  /** Throw an error upon encountering any issue. Default true */
  strict_mode?: boolean;
  /** Skip faulty lines and store them in the rejects table. Default false */
  store_rejects?: boolean;
  /** Temp table name for faulty lines. Default 'reject_errors' */
  rejects_table?: string;
  /** Temp table name for faulty scans. Default 'reject_scans' */
  rejects_scan?: string;
  /** Upper limit on faulty lines recorded per file; 0 = no limit. Default 0 */
  rejects_limit?: number;

  // ── encoding / compression ──────────────────
  /** File encoding: 'utf-8' | 'utf-16' | 'latin-1'. Default 'utf-8' */
  encoding?: string;
  /** Compression method: 'none' | 'gzip' | 'zstd'. Default auto (from file extension) */
  compression?: string;

  // ── multiple files ──────────────────────────
  /** Align columns from different files by name instead of position. Default false */
  union_by_name?: boolean;
  /** Interpret the path as a Hive partitioned path. Default auto-detected */
  hive_partitioning?: boolean;
  /** Add the source file path to each row as a `filename` column. Default false */
  filename?: boolean;
}

/**
 * Options for inline CSV data sources (raw CSV content string)
 */
export interface CSVSourceOptions {
  /** Raw CSV content string */
  csv: string;
  /** Extra DuckDB read_csv options */
  options?: CSVReadOptions;
}

/**
 * Options for CSV file sources: a local file path or an http(s) URL
 */
export interface CSVFileSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
  /** Extra DuckDB read_csv options */
  options?: CSVReadOptions;
}

/**
 * Options for inline JSON data sources (object array)
 */
export interface JsonSourceOptions {
  data: any[];
}

/**
 * Options for JSON file sources: a local file path or an http(s) URL
 */
export interface JsonFileSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for Parquet file sources: a local file path or an http(s) URL
 */
export interface ParquetSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for Excel file sources: a local file path or an http(s) URL.
 * Every sheet in the workbook is registered as its own view.
 */
export interface ExcelSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
}

/**
 * Options for text data sources (extracted via LLM)
 */
export interface TextSourceOptions {
  text: string;
}

/**
 * SSH tunnel options for database sources (forwards the connection through an SSH server)
 */
export interface SSHOptions {
  host: string;
  port?: number;
  user: string;
  password?: string;
}

/**
 * Options for MySQL data sources (ATTACH through DuckDB's mysql extension)
 */
export interface MySQLSourceOptions {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  /** Optional SSH tunnel the MySQL connection is forwarded through */
  ssh?: SSHOptions;
}

/** Options for a local SQLite database (read-only ATTACH). */
export interface SQLiteSourceOptions {
  /** Local SQLite database file path. */
  path: string;
}

/**
 * Options for PostgreSQL data sources (ATTACH through DuckDB's postgres extension)
 */
export interface PostgreSQLSourceOptions {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  /** Schema the tables live in (defaults to `public`) */
  schema?: string;
  /** Optional SSH tunnel the PostgreSQL connection is forwarded through */
  ssh?: SSHOptions;
}

/**
 * Options for Supabase data sources (handled by SaasDBEngine, not the DuckDB
 * engine). Schema is discovered and SQL is executed through the Supabase
 * Management API — data never leaves the SaaS. The OAuth handshake
 * (authorize/token exchange/refresh) is out of scope: the consuming app
 * obtains the access token and passes it here.
 */
export interface SupabaseSourceOptions {
  /** OAuth access token from the Supabase Management API OAuth flow */
  accessToken: string;
  /** Project reference (as returned by GET https://api.supabase.com/v1/projects) */
  projectRef: string;
}

/**
 * External data source configuration for loadSource.
 * - inline types (csv/json/text): data is materialized into JS memory
 * - file types (csv-file/json-file/parquet): loaded through DuckDB's readers
 * - database types (mysql/postgresql/sqlite): ATTACH through DuckDB's extension
 * - cloud types (supabase): schema/SQL over the Management API (SaasDBEngine)
 */
export type DataSourceConfig =
  | { type: 'csv'; options: CSVSourceOptions }
  | { type: 'json'; options: JsonSourceOptions }
  | { type: 'text'; options: TextSourceOptions }
  | { type: 'csv-file'; options: CSVFileSourceOptions }
  | { type: 'json-file'; options: JsonFileSourceOptions }
  | { type: 'parquet'; options: ParquetSourceOptions }
  | { type: 'excel'; options: ExcelSourceOptions }
  | { type: 'mysql'; options: MySQLSourceOptions }
  | { type: 'postgresql'; options: PostgreSQLSourceOptions }
  | { type: 'sqlite'; options: SQLiteSourceOptions }
  | { type: 'supabase'; options: SupabaseSourceOptions };

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
   * Directories the engine whitelists for file access after registering
   * (the data file's directory for file sources; empty for in-memory/remote sources).
   */
  allowedDirectories: string[];
  /** Release resources (temp files, attached databases, tunnels) */
  cleanup: () => Promise<void>;
}

/**
 * Data field metadata
 */
export interface FieldMetadata {
  /** Field name */
  name: string;
  /** Column type from the engine (e.g. DuckDB's BIGINT/VARCHAR) */
  type: string;
  /** Whether the column allows NULL (engine-reported). */
  nullable?: boolean;
}

/**
 * A single index (or constraint-backed index) on a table.
 *
 * DuckDB: duckdb_constraints() for PK/UNIQUE + duckdb_indexes() for secondary indexes.
 * MySQL: INFORMATION_SCHEMA.STATISTICS (one row per column, grouped by index name).
 * PostgreSQL / Supabase: pg_index + pg_constraint (source catalog metadata).
 */
export interface TableIndex {
  /** Index name (e.g. "users_pkey", "idx_orders_user_id") */
  name: string;
  /** Indexed columns in order */
  columns: string[];
  /** Whether the index enforces uniqueness */
  unique: boolean;
  /**
   * Whether this index backs a PRIMARY KEY constraint.
   * DuckDB: duckdb_constraints().constraint_type = 'PRIMARY KEY'.
   * MySQL: INDEX_NAME = 'PRIMARY'.
   * PostgreSQL: pg_index.indisprimary.
   */
  primary?: boolean;
}

/**
 * A database foreign-key relation between tables exposed by a Schema.
 * Supports composite keys, self-relations and multiple relations between tables.
 */
export interface TableRelation {
  /** Foreign-key constraint name, when available. */
  name?: string;
  /** Currently only database foreign-key constraints are supported. */
  kind: 'foreign-key';
  /** Referencing side for a foreign key; table is the exact TableSchema.name. */
  from: { table: string; columns: string[] };
  /** Referenced side for a foreign key; columns pair with from.columns by position. */
  to: { table: string; columns: string[] };
}

/**
 * Schema of a single table/view in the loaded data source
 */
export interface TableSchema {
  /** Table/view name as registered in the engine */
  name: string;
  /** Number of columns */
  columnCount: number;
  /** Field metadata */
  fields: FieldMetadata[];
  /** Indexes on this table. Empty array for tables with no indexes (file-based sources). */
  indexes: TableIndex[];
}

/**
 * The overall schema of the loaded data source.
 */
export interface Schema {
  /** All tables/views exposed by the data source */
  tables: TableSchema[];
  /** Relations between tables */
  relations?: TableRelation[];
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

/**
 * A category value and its count.
 */
export interface MetricFrequency {
  /** The category value. */
  value: string | boolean;
  /** The number of times the value occurs. */
  count: number;
}

/**
 * A field and its metric results.
 */
export type FieldProfile = FieldMetadata & {
  /** The field type shared by all engines. */
  logicalType: LogicalType;
  /** Results keyed by metric name. Missing results were not computed. */
  metrics: Record<string, unknown>;
};

/**
 * A table and its metric results.
 */
export type TableProfile = Omit<TableSchema, 'fields'> & {
  /** Fields with their metric results. */
  fields: FieldProfile[];
  /** Table results keyed by metric name. */
  metrics: Record<string, unknown>;
};

/**
 * The schema with metric results.
 */
export type Profile = Omit<Schema, 'tables'> & {
  /** Tables with their metric results. */
  tables: TableProfile[];
  /** The creation time in milliseconds since the Unix epoch. */
  generatedAt: number;
};

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

/** Executable language expected by an analysis engine. */
export interface QueryLanguage {
  /** Human-readable language or dialect name included in analysis prompts. */
  name: string;
  /** Markdown code-fence language used for executable statements. */
  fence: string;
}

/**
 * An analysis engine: loads a data source, turns natural-language queries
 * into its executable DSL (SQL) via LLM, and executes it.
 * Currently implemented by DuckDBEngine (duckdb/); kept as an interface
 * to allow alternative engines in the future.
 */
export interface AnalysisEngine {
  /** Executable language generated by analysis strategies. */
  readonly language: QueryLanguage;
  /** Load a data source config and return its schema */
  load(config: DataSourceConfig): Promise<Schema>;
  /** Compute statistics for the loaded data. */
  profile?(options?: ProfileOptions): Promise<Profile>;
  /** Generate the executable DSL (SQL) for a natural-language query */
  getDSL(query: string, context?: DataContext): Promise<string>;
  /** Execute one DSL statement with a bounded result. */
  execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>>;
  /** Release resources (temp files, database connections) */
  dispose(): Promise<void>;
}

/** Controls the maximum size of a bounded execution result. */
export interface ExecutionOptions {
  /** Maximum rows returned. Default 200; hard limit 10,000. */
  maxRows?: number;
  /** Maximum serialized UTF-8 bytes returned. Default 1 MiB. */
  maxResultBytes?: number;
}

export interface QueryColumn {
  name: string;
  /** Engine-native type name when available. */
  type?: string;
}

/** A bounded query result. */
export interface ExecutionResult<T = Record<string, unknown>> {
  schema: QueryColumn[];
  data: T[];
  /** Present only when the result was truncated. */
  truncated?: true;
  /** Limit that stopped the result, when truncated. */
  truncatedBy?: 'maxRows' | 'maxResultBytes';
  /** Known only when the bounded query reaches the end of the result. */
  rowCount?: number;
}

/** Built-in analysis strategies. */
export type AnalysisStrategyConfig =
  | {
      type: 'direct';
      /** Execution correction retries after the initial attempt. defaults to 2. */
      maxRetries?: number;
    }
  | { type: 'loop'; maxSteps?: number }
  | { type: 'subset' };

/** Dataset metadata supplied to model-facing consumers. */
export interface DataContext {
  schema: Schema;
  /** Complete structural metadata with optional statistics. */
  profile?: Profile;
}

/** Runtime dependencies available to an analysis strategy. */
export interface AnalysisRuntime {
  context: DataContext;
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
 * Turns a natural-language query into a database-specific DSL.
 */
export interface QueryDialect<TContext = void> {
  /** Generate the executable DSL (SQL) for a natural-language query. */
  getDSL(query: string, context: DataContext): Promise<string>;
  /** Require exactly one read-only DSL statement before execution. */
  validateDSL(dsl: string, context: TContext): Promise<void>;
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
 * Visualization response — chart generation results
 */
export interface VisualizeResponse {
  /** Recommended chart type */
  chartType: ChartType;
  /** GPT-Vis syntax */
  syntax: string;
  /** Standalone HTML that renders the chart */
  html: string;
}

/**
 * Supported chart types from GPT-Vis
 */
export type ChartType =
  | 'line'
  | 'column'
  | 'bar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'dual-axes'
  | 'histogram'
  | 'boxplot'
  | 'radar'
  | 'funnel'
  | 'waterfall'
  | 'liquid'
  | 'word-cloud'
  | 'violin'
  | 'venn'
  | 'treemap'
  | 'sankey'
  | 'table'
  | 'summary';

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
