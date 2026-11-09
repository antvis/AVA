import { z } from 'zod';

import { profileMetadataSchema } from '../contracts/profile';
import { schemaStructure } from '../contracts/schema';
import { semanticMetadataSchema } from '../contracts/semantic';
import { dataModelMetadataSchema } from '../contracts/shared/data-model';

import { escapeMarkdown, markdownTable } from './markdown';

import type { DataModel, Model, Semantic, Profile, Properties, Schema } from '../types';

const modelSchema = profileMetadataSchema.shape.models.element;
const columnSchema = modelSchema.shape.columns.element;

// Assembly rejects unsupported nested fields instead of silently discarding them.
const profileInputSchema = profileMetadataSchema.extend({
  models: z.array(
    modelSchema.strict().extend({
      name: modelSchema.shape.name.min(1),
      columns: z.array(
        columnSchema.strict().extend({
          name: columnSchema.shape.name.min(1),
          properties: columnSchema.shape.properties.strict(),
        })
      ),
    })
  ),
});

export const dataModelInputSchema = z.object({
  schema: schemaStructure.strict(),
  profile: profileInputSchema.optional(),
  semantic: semanticMetadataSchema.optional(),
});

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

/** Describe each semantic object separately, retaining source mappings, properties and observations. */
export function stringifyDataModel({ description, ...dataModel }: DataModel): string {
  const attributes = (value: object): string =>
    markdownTable(Object.entries(value).map(([key, value]) => ({ Attribute: key, Value: value })));
  const metadata = ({ properties, metrics, ...value }: { properties?: Properties; metrics?: Properties }): string =>
    [
      attributes(value),
      properties && Object.keys(properties).length ? `Properties:\n\n${attributes(properties)}` : '',
      metrics && Object.keys(metrics).length ? `Metrics:\n\n${attributes(metrics)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  const sections = ['# Data Model'];

  if (description !== undefined) sections.push(attributes({ description }));

  if (dataModel.properties && Object.keys(dataModel.properties).length) {
    sections.push('## Properties', attributes(dataModel.properties));
  }

  if (dataModel.models?.length) {
    sections.push('## Models');
    for (const { name, columns, ...model } of dataModel.models) {
      sections.push(`### Model: ${escapeMarkdown(name)}`, metadata(model));
      if (columns?.length) {
        sections.push('#### Columns');
        for (const { name, type, ...column } of columns) {
          const summary = [
            `${name} (${type})`,
            column.isCalculated && column.expression ? `[calculated: ${column.expression}]` : '',
            column.relationship ? `[relationship: ${column.relationship}]` : '',
            column.notNull ? 'NOT NULL' : '',
            column.isPrimaryKey ? 'PRIMARY KEY' : '',
          ]
            .filter(Boolean)
            .join(' ');
          sections.push(`- ${escapeMarkdown(summary)}`, metadata(column));
        }
      }
    }
  }

  if (dataModel.relationships?.length) {
    sections.push('## Relationships');
    for (const { name, ...relationship } of dataModel.relationships) {
      const [from, to] = relationship.models;
      sections.push(
        `### Relationship: ${escapeMarkdown(name)}`,
        escapeMarkdown(`${from} → ${to} (${relationship.joinType})`),
        metadata(relationship)
      );
    }
  }

  if (dataModel.views?.length) {
    sections.push('## Views');
    for (const { name, ...view } of dataModel.views) {
      sections.push(`### View: ${escapeMarkdown(name)}`, metadata(view));
    }
  }

  if (dataModel.cubes?.length) {
    sections.push('## Cubes');
    for (const { name, measures, dimensions, timeDimensions, hierarchies, ...cube } of dataModel.cubes) {
      sections.push(`### Cube: ${escapeMarkdown(name)}`, metadata(cube));
      for (const [label, fields] of [
        ['Measures', measures],
        ['Dimensions', dimensions],
        ['Time dimensions', timeDimensions],
      ] as const) {
        if (!fields?.length) continue;
        sections.push(`#### ${label}`);
        for (const { name, type, ...field } of fields) {
          sections.push(`- ${escapeMarkdown(`${name} (${type})`)}`, metadata(field));
        }
      }
      if (hierarchies && Object.keys(hierarchies).length) {
        sections.push(
          '#### Hierarchies',
          ...Object.entries(hierarchies).map(
            ([name, levels]) => `- ${escapeMarkdown(`${name}: ${levels.join(' → ')}`)}`
          )
        );
      }
    }
  }

  // TODO: Above 30,000 characters, retrieve question-relevant context with embeddings; keep full context for now.
  return sections.filter(Boolean).join('\n\n');
}
