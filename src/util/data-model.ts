import { z } from 'zod';

import { jsonValue } from './schema';

import type { DataModel } from '../data-model.types';

const name = z.string().min(1);
const properties = z.record(jsonValue);
const key = z.union([name, z.array(name).nonempty()]);
const column = z
  .object({
    name,
    type: name,
    relationship: name.optional(),
    isCalculated: z.boolean().optional(),
    notNull: z.boolean().optional(),
    expression: z.string().nullable().optional(),
    metrics: properties.optional(),
    properties: properties.optional(),
  })
  .strict();
const tableReference = z
  .object({ catalog: z.string().optional(), schema: z.string().optional(), table: name })
  .catchall(jsonValue);
const model = z
  .object({
    name,
    columns: z.array(column).optional(),
    primaryKey: key.optional(),
    uniqueKeys: z.array(key).optional(),
    metrics: properties.optional(),
    properties: properties.optional(),
    refSql: name.optional(),
    baseObject: name.optional(),
    tableReference: tableReference.optional(),
  })
  .strict()
  .refine(
    (value) =>
      [value.refSql, value.baseObject, value.tableReference].filter((source) => source !== undefined).length === 1,
    'A model must specify exactly one of refSql, baseObject or tableReference'
  );
const relationship = z
  .object({
    name,
    models: z.tuple([name, name]),
    joinType: z.enum(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']),
    condition: name,
    properties: properties.optional(),
  })
  .catchall(jsonValue);
const view = z.object({ name, statement: name, properties: properties.optional() }).catchall(jsonValue);

/** Validate and copy metadata without stripping semantic extensions or observations. */
export const dataModelMetadataSchema = z
  .object({
    models: z.array(model).optional(),
    relationships: z.array(relationship).optional(),
    views: z.array(view).optional(),
    properties: properties.optional(),
  })
  .strict()
  .transform((value) => value as DataModel);
