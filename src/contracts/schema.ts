import { z } from 'zod';

const name = z.string();
const key = z.union([name, z.tuple([name]).rest(name)]);
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
export const schemaInputSchema = z.record(z.string(), z.never());
export const schemaOutputSchema = schemaStructure;
export const schemaMetadataSchema = schemaOutputSchema;

/** Discovery options only; SDK setter callbacks are not part of the data contract. */
export type SchemaInput = z.input<typeof schemaInputSchema>;
export type SchemaOutput = z.output<typeof schemaOutputSchema>;
export type SchemaOptions = SchemaInput;
/** Catalog-discoverable structure; excludes observations and application-defined semantics. */
export type Schema = SchemaOutput;
