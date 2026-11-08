import { z } from 'zod';

import type { DataModel, Model, TableReference, Column, Relationship, JoinType, View } from './shared/data-model';

const name = z.string();
const key = z.union([name, z.array(name).nonempty()]);
export const schemaStructure = z.object({
  models: z.array(
    z.object({
      name,
      tableReference: z.object({ catalog: name.optional(), schema: name.optional(), table: name }),
      columns: z.array(z.object({ name, type: name, notNull: z.boolean().optional() })),
      primaryKey: key.optional(),
      uniqueKeys: z.array(key).optional(),
    })
  ),
  relationships: z
    .array(
      z.object({
        name,
        models: z.tuple([name, name]),
        joinType: z.enum(['ONE_TO_ONE', 'MANY_TO_ONE']),
        condition: name,
      })
    )
    .optional(),
  views: z.array(z.object({ name, statement: name })).optional(),
});
export const schemaMetadataSchema = schemaStructure as unknown as z.ZodType<Schema>;

/** Schema discovery currently has no configurable options. */
export type SchemaOptions = Record<string, never>;

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
