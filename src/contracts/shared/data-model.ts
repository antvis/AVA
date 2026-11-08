import { z } from 'zod';

import { jsonValue } from './json';

const name = z.string().min(1);
const properties = z.record(z.string(), jsonValue);
const key = z.union([name, z.tuple([name]).rest(name)]);

export const column = z
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

export const modelStructure = z
  .object({
    name,
    columns: z.array(column).optional(),
    primaryKey: key.optional(),
    uniqueKeys: z.array(key).optional(),
    dialect: name.optional(),
    metrics: properties.optional(),
    properties: properties.optional(),
  })
  .strict();

/** Share source exclusivity between the complete model and semantic-only model. */
export function withModelSource<S extends z.ZodRawShape>(structure: z.ZodObject<S>) {
  return z.union(
    [
      structure.extend({ refSql: name, baseObject: z.never().optional(), tableReference: z.never().optional() }),
      structure.extend({ refSql: z.never().optional(), baseObject: name, tableReference: z.never().optional() }),
      structure.extend({ refSql: z.never().optional(), baseObject: z.never().optional(), tableReference }),
    ],
    { error: 'A model must specify exactly one of refSql, baseObject or tableReference' }
  );
}
const model = withModelSource(modelStructure);

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
    measures: z.tuple([measure]).rest(measure),
    dimensions: z.array(measure).optional(),
    timeDimensions: z.array(measure).optional(),
    hierarchies: z.record(z.string(), z.tuple([name]).rest(name)).optional(),
    properties: properties.optional(),
  })
  .strict();

export const dataModelStructure = z
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
export const dataModelMetadataSchema = dataModelStructure;

export type Column = z.output<typeof column>;
export type TableReference = z.output<typeof tableReference>;
/** A single column or a nonempty, ordered composite key. */
export type PrimaryKey = z.output<typeof key>;
/** Exactly one of refSql, baseObject or tableReference identifies the source. */
export type Model = z.output<typeof model>;
/** Relationship cardinality, not a SQL join operator such as LEFT or INNER. */
export type JoinType = Relationship['joinType'];
export type Relationship = z.output<typeof relationship>;
export type View = z.output<typeof view>;
/** A reusable aggregation, separate from observed profiling metrics. */
export type Measure = z.output<typeof measure>;
export type CubeDimension = Measure;
export type TimeDimension = CubeDimension;
export type Cube = z.output<typeof cube>;
/** Schema, profiling and semantics enrich the same data model. */
export type DataModel = z.output<typeof dataModelMetadataSchema>;
