/** Aggregations a metric may use. */
export type SemanticAggregation = 'sum' | 'count' | 'count_distinct' | 'avg' | 'min' | 'max';

/** Dialect identifiers understood by the SMQ compiler. */
export type SemanticDialectName =
  | 'duckdb'
  | 'postgresql'
  | 'clickhouse'
  | 'mysql'
  | 'sqlite'
  | 'bigquery'
  | 'snowflake'
  | 'ansi';

/** A groupable / filterable attribute of a semantic model. */
export interface SemanticDimension {
  name: string;
  description?: string;
  /** Physical column. Exactly one of `column` or `expr` is required. */
  column?: string;
  /** SQL expression; use `{TABLE}` as the placeholder for the model's table alias. */
  expr?: string;
  /** Business or database type description, e.g. number, varchar, float, timestamp. */
  type?: string;
}

/** A row-level quantity that can be filtered, grouped or aggregated by a metric. */
export type SemanticMeasure = SemanticDimension;

/** A predefined aggregate or derived aggregate calculation. */
export interface SemanticMetric {
  name: string;
  description?: string;
  agg?: SemanticAggregation;
  /** Physical column the aggregation applies to. Omit with `count` for COUNT(*). */
  column?: string;
  /** SQL expression the aggregation applies to (or the full aggregate when `agg` is omitted); `{TABLE}` is the table alias. */
  expr?: string;
}

/** A semantic model backed by one physical table. */
export interface SemanticModel {
  name: string;
  /** Physical table (optionally schema-qualified, e.g. `main.orders`). */
  table: string;
  description?: string;
  dimensions?: SemanticDimension[];
  measures?: SemanticMeasure[];
  metrics?: SemanticMetric[];
}

/** A join edge between two semantic models. */
export interface SemanticJoin {
  /** Model name on the left side. */
  from: string;
  /** Model name on the right side. */
  to: string;
  /** Equality key pairs: `from` column on the left model, `to` column on the right model. */
  keys?: { from: string; to: string }[];
  /** SQL predicate with {FROM} and {TO} alias placeholders; mutually exclusive with keys. */
  on?: string;
  /** Defaults to `left`. */
  type?: 'inner' | 'left';
}

/** Semantic layer definition. */
export interface SemanticConfig {
  models: SemanticModel[];
  joins?: SemanticJoin[];
  /** SQL dialect for compilation. Inferred from the engine when omitted. */
  dialect?: SemanticDialectName;
}

/** Semantic Model Query. Row elements use model__name; unique metrics may use their bare name. */
export interface SMQ {
  /** Query targets: row elements or predefined aggregate metrics. No implicit aggregation of measures. */
  metrics?: string[];
  /** Boolean expressions such as `orders__status = 'paid'`. Metric references become HAVING conditions. */
  filters?: string[];
  /** Row-level dimensions or measures; without metrics, returns distinct combinations. */
  group_by?: string[];
  order_by?: { field: string; direction?: 'asc' | 'desc' }[];
  limit?: number;
}

/** Result of a deterministic SMQ compilation. */
export interface CompiledSMQ {
  sql: string;
  /** Selection mode, including implicit DISTINCT; does not imply entity uniqueness or join cardinality. */
  grain: 'rows' | 'distinct' | 'aggregate';
  /** Output column aliases, in SELECT order. */
  columns: string[];
  /** Semantic models involved, root first. */
  models: string[];
  /** Physical tables referenced by the SQL. */
  tables: string[];
}

/** A resolved model element, as returned by getModelDataElements. */
export interface SemanticElement {
  name: string;
  kind: 'dimension' | 'measure' | 'metric';
  model: string;
  type?: string;
  description?: string;
}
