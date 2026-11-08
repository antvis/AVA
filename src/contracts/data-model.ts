import { z } from 'zod';

import { jsonValue } from './json';
import { schemaStructure } from './schema';
import { profileInputSchema } from './profile';

import type { Schema } from './schema';
import type { Profile } from './profile';
import type { JsonValue, Properties } from './json';

const name = z.string().min(1);
const properties = z.record(z.string(), jsonValue);
const key = z.union([name, z.array(name).nonempty()]);

const column = z
  .object({
    name,
    type: name,
    relationship: name.optional(),
    isCalculated: z.boolean().optional(),
    isPrimaryKey: z.boolean().optional(),
    notNull: z.boolean().optional(),
    expression: z.string().nullable().optional(),
    metrics: properties.optional(),
    properties: properties.optional(),
  })
  .strict();

const tableReference = z
  .object({ catalog: z.string().optional(), schema: z.string().optional(), table: name })
  .catchall(jsonValue);

const modelStructure = z
  .object({
    name,
    columns: z.array(column).optional(),
    primaryKey: key.optional(),
    uniqueKeys: z.array(key).optional(),
    dialect: name.optional(),
    metrics: properties.optional(),
    properties: properties.optional(),
    refSql: name.optional(),
    baseObject: name.optional(),
    tableReference: tableReference.optional(),
  })
  .strict();

const hasSingleSource = (value: z.infer<typeof modelStructure>) =>
  [value.refSql, value.baseObject, value.tableReference].filter((source) => source !== undefined).length === 1;
const modelSourceMessage = 'A model must specify exactly one of refSql, baseObject or tableReference';
const model = modelStructure.refine(hasSingleSource, modelSourceMessage);

const relationship = z
  .object({
    name,
    models: z.tuple([name, name]),
    joinType: z.enum(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']),
    condition: name,
    properties: properties.optional(),
  })
  .catchall(jsonValue);

const view = z
  .object({ name, statement: name, dialect: name.optional(), properties: properties.optional() })
  .catchall(jsonValue);

const measure = z
  .object({ name, expression: name, type: name, description: z.string().optional(), properties: properties.optional() })
  .strict();

const cube = z
  .object({
    name,
    baseObject: name,
    measures: z.array(measure).nonempty(),
    dimensions: z.array(measure).optional(),
    timeDimensions: z.array(measure).optional(),
    hierarchies: z.record(z.string(), z.array(name).nonempty()).optional(),
    properties: properties.optional(),
  })
  .strict();

const dataModelStructure = z
  .object({
    description: z.string().optional(),
    models: z.array(model).optional(),
    relationships: z.array(relationship).optional(),
    views: z.array(view).optional(),
    cubes: z.array(cube).optional(),
    properties: properties.optional(),
  })
  .strict();

/** Validate and copy metadata without stripping semantic extensions or observations. */
export const dataModelMetadataSchema = dataModelStructure as unknown as z.ZodType<DataModel>;

/** Semantic definitions exclude model and column profiling metrics. */
export const semanticMetadataSchema = dataModelStructure.extend({
  models: z
    .array(
      modelStructure
        .omit({ metrics: true })
        .extend({ columns: z.array(column.omit({ metrics: true })).optional() })
        .refine(hasSingleSource, modelSourceMessage)
    )
    .optional(),
}) as unknown as z.ZodType<Semantic>;

export const dataModelInputSchema = z.object({
  schema: schemaStructure.strict(),
  profile: profileInputSchema.optional(),
  semantic: semanticMetadataSchema.optional(),
}) as unknown as z.ZodType<{ schema: Schema; profile?: Profile; semantic?: Semantic }>;

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
