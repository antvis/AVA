import { z } from 'zod';

import { escapeMarkdown, markdownTable } from './markdown';
import { jsonValue, schemaStructure } from './schema';

import type { Column, DataModel, Model, Profile, Schema } from '../types';

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

const dataModelInputSchema = z
  .object({
    schema: schemaStructure.strict(),
    profile: z
      .object({
        models: z.array(
          z
            .object({
              name,
              metrics: properties,
              columns: z.array(
                z
                  .object({
                    name,
                    metrics: properties,
                    properties: z
                      .object({ logicalType: z.enum(['numeric', 'string', 'boolean', 'date', 'unknown']) })
                      .strict(),
                  })
                  .strict()
              ),
            })
            .strict()
        ),
      })
      .strict()
      .optional(),
  })
  .transform((value) => value as { schema: Schema; profile?: Profile });

function indexByName<T extends { name: string }>(values: T[], label: string): Map<string, T> {
  const index = new Map<string, T>();

  for (const value of values) {
    if (index.has(value.name)) throw new Error(`Duplicate ${label}: ${value.name}`);

    index.set(value.name, value);
  }

  return index;
}

/** Build an independent snapshot; partial profiles enrich only the named models and columns. */
export function buildDataModel(input: { schema: Schema; profile?: Profile }): DataModel {
  const { schema, profile } = dataModelInputSchema.parse(input);

  const models = indexByName<Model & { columns: Column[] }>(schema.models, 'schema model');
  const columns = new Map(
    [...models].map(([name, model]) => [name, indexByName(model.columns, `schema column in model "${name}"`)])
  );

  for (const observation of indexByName(profile?.models ?? [], 'profile model').values()) {
    const model = models.get(observation.name);
    if (!model) throw new Error(`Unknown profile model: ${observation.name}`);

    model.metrics = observation.metrics;

    for (const field of indexByName(observation.columns, `profile column in model "${model.name}"`).values()) {
      const column = columns.get(model.name)!.get(field.name);
      if (!column) throw new Error(`Unknown profile column: ${model.name}.${field.name}`);

      column.metrics = field.metrics;
      column.properties = field.properties;
    }
  }

  return dataModelMetadataSchema.parse(schema);
}

/** Render model metadata as Markdown, keeping optional attributes with their owning objects. */
export function stringifyDataModel(dataModel: DataModel): string {
  const attributes = (value: object): string =>
    markdownTable(Object.entries(value).map(([key, value]) => ({ Attribute: key, Value: value })));
  const sections = ['# Data Model'];

  if (dataModel.properties && Object.keys(dataModel.properties).length) {
    sections.push('## Properties', attributes(dataModel.properties));
  }

  if (dataModel.models?.length) {
    sections.push('## Models');
    for (const { name, columns, ...metadata } of dataModel.models) {
      sections.push(`### ${escapeMarkdown(name)}`, attributes(metadata));
      if (columns?.length) sections.push('#### Columns', markdownTable(columns));
    }
  }

  if (dataModel.relationships?.length) sections.push('## Relationships', markdownTable(dataModel.relationships));
  if (dataModel.views?.length) sections.push('## Views', markdownTable(dataModel.views));

  return sections.filter(Boolean).join('\n\n');
}
