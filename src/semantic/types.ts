/** Aggregations a measure may use. */
export type SemanticAggregation = 'sum' | 'count' | 'count_distinct' | 'avg' | 'min' | 'max';

/** Dialect identifiers understood by the SMQ compiler. */
export type SemanticDialectName = 'duckdb' | 'postgresql' | 'clickhouse' | 'mysql' | 'ansi';

/** A groupable / filterable attribute of a semantic model. */
export interface SemanticDimension {
  name: string;
  description?: string;
  /** Physical column. Exactly one of `column` or `expr` is required. */
  column?: string;
  /** SQL expression; use `{TABLE}` as the placeholder for the model's table alias. */
  expr?: string;
  type?: 'string' | 'number' | 'boolean' | 'time';
}

/** An aggregated value of a semantic model. */
export interface SemanticMeasure {
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
}

/** A join edge between two semantic models. */
export interface SemanticJoin {
  /** Model name on the left side. */
  from: string;
  /** Model name on the right side. */
  to: string;
  /** Equality key pairs: `from` column on the left model, `to` column on the right model. */
  keys: { from: string; to: string }[];
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

/** Semantic Model Query. Elements are referenced as `<model>__<name>`. */
export interface SMQ {
  metrics?: string[];
  /** Boolean expressions such as `orders__status = 'paid'`. Metric references become HAVING conditions. */
  filters?: string[];
  group_by?: string[];
  order_by?: { field: string; direction?: 'asc' | 'desc' }[];
  limit?: number;
}

/** Result of a deterministic SMQ compilation. */
export interface CompiledSMQ {
  sql: string;
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
  kind: 'dimension' | 'measure';
  model: string;
  table: string;
  type?: string;
  description?: string;
}
