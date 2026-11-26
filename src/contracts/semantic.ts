import { compileSchema } from 'json-schema-library';
import { parseDocument } from 'yaml';
import { z } from 'zod';

import ossieSchema from './ossie/ossie-schema.json';
import { jsonValue } from './shared/json';

import type { ApacheOssieCoreMetadataSpecification } from './ossie/types.generated';

type OssieModel = ApacheOssieCoreMetadataSpecification;

export const semanticInputSchema = z.record(z.string(), z.never());

const validator = compileSchema(ossieSchema);

export const semanticOutputSchema = (z.unknown() as z.ZodType<OssieModel>)
  .superRefine((model, context) => {
    const json = jsonValue.safeParse(model);
    if (!json.success) {
      context.addIssue({ code: 'custom', message: 'Expected a JSON-compatible Ossie model.', fatal: true });
      return;
    }
    const result = validator.validate(model);
    if (!result.valid) {
      for (const error of result.errors) {
        const path = (error.data?.pointer ?? '#').split('/').slice(1);
        context.addIssue({ code: 'custom', path, message: error.message });
      }
      return;
    }

    const issue = (path: (string | number)[], message: string) => context.addIssue({ code: 'custom', path, message });
    const uniqueNames = (items: { name: string }[], path: (string | number)[], fold = false) => {
      const names = new Set<string>();
      items.forEach(({ name }, index) => {
        const key = fold ? name.toLowerCase() : name;
        if (names.has(key)) issue([...path, index, 'name'], `Duplicate name "${name}".`);
        names.add(key);
      });
      return names;
    };
    const checkFields = (key: string[], declared: Set<string>, path: (string | number)[]) => {
      const seen = new Set<string>();
      key.forEach((name, index) => {
        const field = name.toLowerCase();
        if (!declared.has(field)) issue([...path, index], `Unknown field "${name}".`);
        if (seen.has(field)) issue([...path, index], `Repeated field "${name}".`);
        seen.add(field);
      });
    };

    uniqueNames(model.datasets, ['datasets']);
    uniqueNames(model.metrics ?? [], ['metrics']);
    uniqueNames(model.relationships ?? [], ['relationships']);
    const datasets = new Map<string, Set<string>>();
    model.datasets.forEach((dataset, index) => {
      const path = ['datasets', index];
      const fields = uniqueNames(dataset.fields ?? [], [...path, 'fields'], true);
      uniqueNames(dataset.metrics ?? [], [...path, 'metrics'], true);
      dataset.metrics?.forEach(({ name }, metric) => {
        if (fields.has(name.toLowerCase())) {
          issue([...path, 'metrics', metric, 'name'], `Metric "${name}" conflicts with a dataset field.`);
        }
      });
      datasets.set(dataset.name, fields);
      if (dataset.primary_key) checkFields(dataset.primary_key, fields, [...path, 'primary_key']);
      dataset.unique_keys?.forEach((key, keyIndex) => checkFields(key, fields, [...path, 'unique_keys', keyIndex]));
    });
    model.relationships?.forEach((relationship, index) => {
      const path = ['relationships', index];
      for (const side of ['from', 'to'] as const) {
        const dataset = datasets.get(relationship[side]);
        const columns = `${side}_columns` as const;
        if (dataset) checkFields(relationship[columns], dataset, [...path, columns]);
        else issue([...path, side], `Unknown dataset "${relationship[side]}".`);
      }
      if (relationship.from_columns.length !== relationship.to_columns.length) {
        issue(path, 'Relationship column lists must have the same length.');
      }
    });
  })
  .overwrite((model) => structuredClone(model))
  .meta(ossieSchema);

/** Parse and validate an Ossie core model serialized as YAML or JSON. */
export function parseSemantic(text: string): OssieModel {
  const document = parseDocument(text, { stringKeys: true });
  const problem = document.errors[0] ?? document.warnings[0];
  if (problem) throw new Error(`Cannot read Ossie YAML or JSON: ${problem.message}`);
  return semanticOutputSchema.parse(document.toJS());
}
