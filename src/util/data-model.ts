import { z } from 'zod';

import { escapeMarkdown, markdownTable } from './markdown';
import { jsonValue, schemaStructure } from './schema';

import type { DataModel, Model, Profile, Schema, Semantic } from '../types';

const name = z.string().min(1);
const properties = z.record(jsonValue);
const key = z.union([name, z.array(name).nonempty()]);
const refreshTime = z.string().regex(/^\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*$/);
const sessionProperty = z
  .object({ name, required: z.boolean(), defaultExpr: z.string().nullable().optional() })
  .strict();
const rowLevelAccessControl = z
  .object({ name, requiredProperties: z.array(sessionProperty), condition: name })
  .strict();
const columnLevelAccessControl = z
  .object({
    name,
    operator: z.enum([
      'EQUALS',
      'NOT_EQUALS',
      'GREATER_THAN',
      'LESS_THAN',
      'GREATER_THAN_OR_EQUALS',
      'LESS_THAN_OR_EQUALS',
    ]),
    requiredProperties: z.tuple([sessionProperty]),
    threshold: z
      .object({ value: z.string(), dataType: z.enum(['NUMERIC', 'STRING']) })
      .strict()
      .optional(),
  })
  .strict();

const column = z
  .object({
    name,
    type: name,
    relationship: name.optional(),
    isCalculated: z.boolean().optional(),
    isPrimaryKey: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    columnLevelAccessControl: columnLevelAccessControl.optional(),
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
    cached: z.boolean().optional(),
    refreshTime: refreshTime.optional(),
    rowLevelAccessControls: z.array(rowLevelAccessControl).optional(),
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
    hierarchies: z.record(z.array(name).nonempty()).optional(),
    refreshTime: refreshTime.optional(),
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

const dataModelInputSchema = z.object({
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
  semantic: semanticMetadataSchema.optional(),
}) as unknown as z.ZodType<{ schema: Schema; profile?: Profile; semantic?: Semantic }>;

function indexByName<T extends { name: string }>(values: T[], label: string): Map<string, T> {
  const index = new Map<string, T>();

  for (const value of values) {
    if (index.has(value.name)) throw new Error(`Duplicate ${label}: ${value.name}`);

    index.set(value.name, value);
  }

  return index;
}

/** Build an independent snapshot, enriching schema and observations with named semantic definitions. */
export function buildDataModel(input: { schema: Schema; profile?: Profile; semantic?: Semantic }): DataModel {
  const { schema, profile, semantic } = dataModelInputSchema.parse(input);

  const models = indexByName<Model>(schema.models, 'schema model');
  const columns = new Map(
    [...models].map(([name, model]) => [name, indexByName(model.columns ?? [], `schema column in model "${name}"`)])
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

  for (const definition of indexByName(semantic?.models ?? [], 'semantic model').values()) {
    const current = models.get(definition.name);
    const model = { ...current, ...definition } as Model;
    if (definition.refSql !== undefined || definition.baseObject !== undefined) delete model.tableReference;
    if (current?.properties || definition.properties) {
      model.properties = { ...current?.properties, ...definition.properties };
    }

    if (definition.columns) {
      const fields = indexByName(current?.columns ?? [], `schema column in model "${definition.name}"`);
      for (const field of indexByName(definition.columns, `semantic column in model "${definition.name}"`).values()) {
        const original = fields.get(field.name);
        const column = { ...original, ...field };
        if (original?.properties || field.properties) {
          column.properties = { ...original?.properties, ...field.properties };
        }
        fields.set(field.name, column);
      }
      model.columns = [...fields.values()];
    }

    models.set(definition.name, model);
  }

  return dataModelMetadataSchema.parse({ ...schema, ...semantic, models: [...models.values()] });
}

/** Render model metadata as Markdown, keeping optional attributes with their owning objects. */
export function stringifyDataModel({ description, ...dataModel }: DataModel): string {
  const attributes = (value: object): string =>
    markdownTable(Object.entries(value).map(([key, value]) => ({ Attribute: key, Value: value })));
  const sections = ['# Data Model'];

  if (description !== undefined) sections.push(attributes({ description }));

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
  if (dataModel.cubes?.length) sections.push('## Cubes', markdownTable(dataModel.cubes));

  return sections.filter(Boolean).join('\n\n');
}
