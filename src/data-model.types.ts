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
  /** Context describing the view's purpose or business conventions. */
  properties?: Properties;
  /** Additional attributes with consumer-defined meaning; validate unknown values before use. */
  [key: string]: unknown;
}

/** Schema, profiling and semantics enrich the same data model. */
export interface DataModel {
  /** Context shared across models; per-model and per-column metadata stays with its owning object. */
  properties?: Properties;
  /** Logical datasets, source mappings, columns and their computed observations. */
  models?: Model[];
  /** Declared joins between models; omission provides no evidence that models are unrelated. */
  relationships?: Relationship[];
  /** Reusable named queries; discovering a database view does not automatically supply its SQL definition. */
  views?: View[];
}
