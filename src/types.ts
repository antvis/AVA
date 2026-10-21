/**
 * Core type definitions for AVA v4
 */

import type { ClickHouseClientConfigOptions } from '@clickhouse/client';
import type { LanguageModelUsage, LanguageModel } from 'ai';
import type { AnalysisEvent } from './event';

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
   * Source loading and result limits are included in the script; configure remote execution deadlines separately.
   */
  execute?: (code: string) => Promise<ExecutionResult>;
  /** Client wait limit and local process execution deadline. Default 30000 ms. */
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

/**
 * Data source types for load.
 * - inline types: `csv` (content string), `json` (object array), `text`
 * - file types: `csv-file`, `json-file`, `parquet` (read through DuckDB's readers)
 * - database types: `mysql`, `postgresql`, `sqlite`, `mongodb` (ATTACH through DuckDB's extension)
 * - direct query types: `clickhouse` (schema discovered and SQL executed through ClickHouse's HTTP API)
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
  | 'mongodb'
  | 'supabase'
  | 'clickhouse';

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
  /** File encoding (default 'utf-8'). Others such as 'gb18030' require the DuckDB encodings extension. */
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
 * DuckDB read_json parameters, including shared JSON reader options.
 * https://duckdb.org/docs/current/data/json/loading_json
 * Optional fields use DuckDB defaults. These options apply only to DuckDB.
 */
export interface JSONReadOptions {
  /** Infer columns and types. Default true */
  auto_detect?: boolean;
  /** Column names mapped to DuckDB types; omitted columns are excluded */
  columns?: Record<string, string>;
  /** Compression codec. Default auto_detect */
  compression?: 'auto_detect' | 'none' | 'gzip' | 'zstd';
  /** Date parsing pattern. Default 'iso' */
  dateformat?: string;
  /** Average field frequency below which objects become MAPs. Default 0.1 */
  field_appearance_threshold?: number;
  /** Include filename in SELECT *. Default false; also available as a virtual column */
  filename?: boolean;
  /** Input layout. read_json defaults to auto-detection */
  format?: 'auto' | 'unstructured' | 'newline_delimited' | 'array';
  /** Read Hive partitions from paths. Default auto-detected */
  hive_partitioning?: boolean;
  /** Skip parse errors; requires newline_delimited format. Default false */
  ignore_errors?: boolean;
  /** Subfield count above which STRUCT becomes MAP; -1 disables. Default 200 */
  map_inference_threshold?: number;
  /** Inference depth; -1 means unlimited. Default -1 */
  maximum_depth?: number;
  /** Object size limit in bytes. Default 16777216 */
  maximum_object_size?: number;
  /** File count used for inference. Default 32 */
  maximum_sample_files?: number;
  /** Unpack objects into columns. Default 'auto' */
  records?: 'auto' | 'true' | 'false';
  /** Objects sampled for inference; -1 scans all. Default 20480 */
  sample_size?: number;
  /** Timestamp parsing pattern. Default 'iso' */
  timestampformat?: string;
  /** Merge file schemas by column name. Default false */
  union_by_name?: boolean;
}

/**
 * Options for inline JSON data sources (object array)
 */
export interface JsonSourceOptions {
  data: any[];
  /** Extra DuckDB read_json options */
  options?: JSONReadOptions;
}

/**
 * Options for JSON file sources: a local file path or an http(s) URL
 */
export interface JsonFileSourceOptions {
  /** Extra DuckDB read_json options */
  options?: JSONReadOptions;
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
 * Selected sheets are registered as separate views (all sheets when omitted).
 */
export interface ExcelSourceOptions {
  /** Local file path or http(s) URL */
  path: string;
  /** HTTP headers for remote sources (e.g. Authorization) */
  headers?: Record<string, string>;
  /** Per-sheet selections; omitted selects all, an empty list is invalid. */
  sheets?: ExcelSheetOptions[];
}

/** Read settings for one Excel worksheet. */
export interface ExcelSheetOptions extends ExcelReadOptions {
  /** Exact worksheet name. */
  sheet: string;
}

/**
 * DuckDB read_xlsx reader options, applied independently to each sheet.
 * https://duckdb.org/docs/current/core_extensions/excel#reading-xlsx-files
 */
export interface ExcelReadOptions {
  /** Inclusive A1 rectangle, e.g. B3:F100. */
  range?: string;
  /** Whether the first row contains column names. Defaults to true. */
  header?: boolean;
  /** DuckDB only: read every cell as VARCHAR. Defaults to false. */
  all_varchar?: boolean;
  /** DuckDB only: replace cells that fail type conversion with NULL. Defaults to false. */
  ignore_errors?: boolean;
  /** DuckDB only: stop at an empty row. Defaults to false with range, true without. */
  stop_at_empty?: boolean;
  /** DuckDB only: infer empty cells as VARCHAR instead of DOUBLE. Defaults to false. */
  empty_as_varchar?: boolean;
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
 * Options for MongoDB data sources (ATTACH through DuckDB's mongo community extension)
 *
 * Supports two connection modes:
 * - **Structured fields** (`host`, `port`, `user`, `password`, …) — the loader
 *   builds a key-value connection string for the ATTACH.
 * - **Advanced `connection` string** — a raw DuckDB mongo connection string or
 *   a MongoDB URI (`mongodb://…` / `mongodb+srv://…`). When provided, it takes
 *   precedence over all structured fields.
 *
 * See https://github.com/stephaniewang526/duckdb-mongo for the full parameter list.
 */
export interface MongoDBSourceOptions {
  /**
   * Advanced connection string, e.g. `host=localhost port=27017` or
   * `mongodb://user:pass@host:27017/db`. Takes precedence over all structured
   * fields when provided.
   */
  connection?: string;
  /** MongoDB hostname or IP address (default `localhost`). */
  host?: string;
  /** MongoDB port number (default `27017`). */
  port?: number;
  /** Database name to expose as DuckDB tables (required). */
  database: string;
  /** MongoDB username. */
  user?: string;
  /** MongoDB password. */
  password?: string;
  /** Authentication database (MongoDB `authSource`). */
  authSource?: string;
  /** Use SRV connection format (for MongoDB Atlas). */
  srv?: boolean;
  /** Enable TLS/SSL encryption. Alias: `ssl`. */
  tls?: boolean;
  /** Alias for `tls`. */
  ssl?: boolean;
  /** Path to CA certificate file for TLS. */
  tlsCAFile?: string;
  /** Allow invalid certificates (testing only, default false). */
  tlsAllowInvalidCertificates?: boolean;
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
 * Options for ClickHouse data sources (executed remotely through the official
 * ClickHouse JS client rather than through DuckDB ATTACH).
 */
export type ClickHouseSourceOptions = Omit<ClickHouseClientConfigOptions, 'host' | 'url' | 'username' | 'database'> & {
  /** ClickHouse server host or host:port pair. `url` takes precedence when both are set. */
  host?: string;
  /** Full ClickHouse server URL (for example `http://localhost:8123`). */
  url?: string;
  /** Override the port in `host`/`url`. */
  port?: number;
  /** Database name to query. */
  database: string;
  /** Official client field name for the username. */
  username?: string;
  /** Alias matching AVA's MySQL/PostgreSQL source options. */
  user?: string;
  /** Password for the ClickHouse user. */
  password?: string;
};

/**
 * External data source configuration for loadSource.
 * - inline types (csv/json/text): data is materialized into JS memory
 * - file types (csv-file/json-file/parquet): loaded through DuckDB's readers
 * - database types (mysql/postgresql/sqlite/mongodb): ATTACH through DuckDB's extension
 * - direct query types (clickhouse): schema/SQL over ClickHouse's HTTP API
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
  | { type: 'mongodb'; options: MongoDBSourceOptions }
  | { type: 'supabase'; options: SupabaseSourceOptions }
  | { type: 'clickhouse'; options: ClickHouseSourceOptions };

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

  /** Environment bindings and result conventions needed when generating code. */
  instructions?: string;
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
  /** Load a data source and prepare it for execution. */
  load(config: DataSourceConfig): Promise<void>;
  /** Discover the loaded source structure. */
  schema(): Promise<Schema>;
  /** Compute statistics for the loaded data. */
  profile?(schema: Schema, options?: ProfileOptions): Promise<Profile>;
  /** Generate the executable DSL (SQL) for a natural-language query */
  getDSL(query: string, dataModel: DataModel): Promise<string>;
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

/** Unified data structure, profiling results and semantics for AVA. */

/** Serializable metadata values; numeric finiteness must be checked at runtime. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Extensible metadata whose keys and meanings are agreed on by producers and consumers. */
export type Properties = Record<string, JsonValue>;

/** A session value referenced by a declared access-control rule. */
export interface SessionProperty {
  name: string;
  required: boolean;
  /** SQL fallback when the session does not supply a value. */
  defaultExpr?: string | null;
}

/** Declarative row filter; enforcement belongs to the semantic execution layer. */
export interface RowLevelAccessControl {
  name: string;
  requiredProperties: SessionProperty[];
  /** SQL predicate over the model and session properties. */
  condition: string;
}

export type ColumnLevelOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_THAN_OR_EQUALS'
  | 'LESS_THAN_OR_EQUALS';

/** Declarative column access rule; storing it does not enforce access. */
export interface ColumnLevelAccessControl {
  name: string;
  operator: ColumnLevelOperator;
  requiredProperties: [SessionProperty];
  threshold?: { value: string; dataType: 'NUMERIC' | 'STRING' };
}

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
  /** Declares a hidden field; visibility must be enforced by the semantic execution layer. */
  isHidden?: boolean;
  columnLevelAccessControl?: ColumnLevelAccessControl;
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
  /** Cache declarations for a semantic execution layer; no cache is created by this metadata. */
  cached?: boolean;
  refreshTime?: string;
  rowLevelAccessControls?: RowLevelAccessControl[];
  /**
   * Model-wide observations keyed by metric name, e.g. row_count.
   * Missing means uncomputed/omitted; null means no usable aggregate; zero and [] are actual results.
   */
  metrics?: Record<string, JsonValue>;
  /** Model-level context such as business descriptions or source annotations. */
  properties?: Properties;
} & (
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
    }
);

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
  refreshTime?: string;
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
 * Turns a natural-language query into a database-specific DSL.
 */
export interface QueryDialect<TContext = void> {
  /** Generate the executable DSL (SQL) for a natural-language query. */
  getDSL(query: string, dataModel: DataModel): Promise<string>;
  /** Validate one read-only statement and return the DSL to execute, normalized if needed. */
  validateDSL(dsl: string, context: TContext): Promise<string>;
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
export interface ChartSpec {
  /** Recommended chart type */
  chartType: ChartType;
  /** GPT-Vis JSON config; its `type` matches chartType */
  config: ChartConfig;
}

/**
 * Visualization response — chart generation results
 */
export interface VisualizeResponse extends ChartSpec {
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
