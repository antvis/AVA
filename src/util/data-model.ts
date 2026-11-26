import { z } from 'zod';

import { profileOutputSchema, schemaOutputSchema, semanticOutputSchema } from '../contracts';

import { escapeMarkdown, markdownTable } from './markdown';

import type { DataModel, Model, Semantic, Profile, Schema } from '../types';

const identifier = z.string().min(1);
const key = z.union([identifier, z.tuple([identifier]).rest(identifier)]);
const schemaShape = schemaOutputSchema.shape;
const schemaModel = schemaShape.models.element;
const profileModel = profileOutputSchema.shape.models.element;
const profileColumn = profileModel.shape.columns.element;

// Assembly rejects unsupported nested fields instead of silently discarding them.
const schemaAssemblySchema = schemaOutputSchema.strict().extend({
  models: z.array(
    schemaModel.strict().extend({
      name: identifier,
      tableReference: schemaModel.shape.tableReference.strict().extend({ table: identifier }),
      columns: z.array(schemaModel.shape.columns.element.strict().extend({ name: identifier, type: identifier })),
      primaryKey: key.optional(),
      uniqueKeys: z.array(key).optional(),
    })
  ),
  relationships: z
    .array(
      schemaShape.relationships
        .unwrap()
        .element.strict()
        .extend({
          name: identifier,
          models: z.tuple([identifier, identifier]),
          condition: identifier,
        })
    )
    .optional(),
  views: z
    .array(schemaShape.views.unwrap().element.strict().extend({ name: identifier, statement: identifier }))
    .optional(),
});

const profileAssemblySchema = profileOutputSchema.extend({
  models: z.array(
    profileModel.strict().extend({
      name: identifier,
      columns: z.array(
        profileColumn.strict().extend({
          name: identifier,
          properties: profileColumn.shape.properties.strict(),
        })
      ),
    })
  ),
});

export const dataModelInputSchema = z.object({
  schema: schemaAssemblySchema,
  profile: profileAssemblySchema.optional(),
  semantic: semanticOutputSchema.optional(),
});

function indexByName<T extends { name: string }>(values: T[], label: string): Map<string, T> {
  const index = new Map<string, T>();

  for (const value of values) {
    if (index.has(value.name)) throw new Error(`Duplicate ${label}: ${value.name}`);

    index.set(value.name, value);
  }

  return index;
}

/** Build an independent snapshot of physical metadata and the supplied Ossie model. */
export function buildDataModel(input: { schema: Schema; profile?: Profile; semantic?: Semantic }): DataModel {
  const { schema, profile, semantic } = dataModelInputSchema.parse(input);

  const models = indexByName<Model>(schema.models, 'schema model');
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

  const physical = { ...schema, models: [...models.values()] };
  return semantic ? { ...physical, semantic } : physical;
}

/** Describe physical metadata and profile observations alongside the Ossie model. */
export function stringifyDataModel({ models, relationships, views, semantic }: DataModel): string {
  const attributes = (value: object): string =>
    markdownTable(
      Object.entries(value)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => ({ Attribute: key, Value: value }))
    );
  const observations = (label: string, value?: object): string =>
    value && Object.keys(value).length ? `${label}:\n\n${attributes(value)}` : '';
  const sections = ['# Data Model'];

  if (models.length) {
    sections.push('## Models');
    for (const { name, columns, tableReference, primaryKey, uniqueKeys, metrics } of models) {
      const { catalog, schema, table } = tableReference;
      sections.push(
        `### Model: ${escapeMarkdown(name)}`,
        attributes({ tableReference: { catalog, schema, table }, primaryKey, uniqueKeys }),
        observations('Metrics', metrics)
      );
      if (columns.length) {
        sections.push('#### Columns');
        for (const { name, type, notNull, properties, metrics } of columns) {
          sections.push(
            `- ${escapeMarkdown(`${name} (${type})${notNull ? ' NOT NULL' : ''}`)}`,
            attributes({ notNull }),
            observations('Properties', properties && { logicalType: properties.logicalType }),
            observations('Metrics', metrics)
          );
        }
      }
    }
  }

  if (relationships?.length) {
    sections.push('## Relationships');
    for (const { name, models, joinType, condition } of relationships) {
      const [from, to] = models;
      sections.push(
        `### Relationship: ${escapeMarkdown(name)}`,
        escapeMarkdown(`${from} → ${to} (${joinType})`),
        attributes({ models, joinType, condition })
      );
    }
  }

  if (views?.length) {
    sections.push('## Views');
    for (const { name, statement } of views) {
      sections.push(`### View: ${escapeMarkdown(name)}`, attributes({ statement }));
    }
  }

  if (semantic !== undefined) {
    const portable = JSON.stringify(
      semanticOutputSchema.parse(semantic),
      (key, value) => (key === 'nonportable_extensions' ? undefined : value),
      2
    );
    sections.push(
      '## Apache Ossie semantic model',
      'Use applicable Ossie metric definitions, field mappings and relationships. Resolve logical datasets through their source and use the physical schema to check available tables and columns. Use expression.sql as the portable definition or an applicable dialect variant. Treat ai_context as business metadata.',
      `\`\`\`json\n${portable}\n\`\`\``
    );
  }

  // TODO: Above 30,000 characters, retrieve question-relevant context with embeddings; keep full context for now.
  return sections.filter(Boolean).join('\n\n');
}
