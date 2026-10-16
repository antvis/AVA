import { semanticConfigSchema } from './schema';

import type { Schema } from '../types';
import type {
  SemanticConfig,
  SemanticDimension,
  SemanticElement,
  SemanticJoin,
  SemanticMeasure,
  SemanticModel,
} from './types';

/** Separator between a model name and an element name in SMQ references. */
export const ELEMENT_SEPARATOR = '__';

export interface ResolvedElement {
  kind: 'dimension' | 'measure';
  model: SemanticModel;
  dimension?: SemanticDimension;
  measure?: SemanticMeasure;
}

/** Validated, explicitly defined semantic models and their join graph. */
export class SemanticRegistry {
  readonly models = new Map<string, SemanticModel>();
  readonly joins: SemanticJoin[];
  readonly dialect?: SemanticConfig['dialect'];

  constructor(config: SemanticConfig | string) {
    const raw = typeof config === 'string' ? JSON.parse(config) : config;
    const parsed = semanticConfigSchema.parse(raw) as SemanticConfig;

    for (const model of parsed.models) {
      if (this.models.has(model.name)) throw new Error(`Duplicate semantic model: ${model.name}`);

      const names = new Set<string>();
      for (const element of [...(model.dimensions ?? []), ...(model.measures ?? [])]) {
        if (names.has(element.name)) throw new Error(`Duplicate element ${model.name}${ELEMENT_SEPARATOR}${element.name}`);
        names.add(element.name);
      }
      this.models.set(model.name, model);
    }

    for (const join of parsed.joins ?? []) {
      for (const side of [join.from, join.to]) {
        if (!this.models.has(side)) throw new Error(`Join references unknown model: ${side}`);
      }
      if (join.from === join.to) throw new Error(`Join cannot connect model ${join.from} to itself`);
    }

    this.joins = parsed.joins ?? [];
    this.dialect = parsed.dialect;
  }

  /** Resolve a `<model>__<element>` reference. */
  resolve(reference: string): ResolvedElement {
    const index = reference.indexOf(ELEMENT_SEPARATOR);
    if (index <= 0) throw new Error(`Invalid element reference "${reference}"; expected <model>${ELEMENT_SEPARATOR}<name>`);

    const modelName = reference.slice(0, index);
    const name = reference.slice(index + ELEMENT_SEPARATOR.length);
    const model = this.models.get(modelName);
    if (!model) throw new Error(`Unknown semantic model "${modelName}" in "${reference}"`);

    const dimension = model.dimensions?.find((d) => d.name === name);
    if (dimension) return { kind: 'dimension', model, dimension };
    const measure = model.measures?.find((m) => m.name === name);
    if (measure) return { kind: 'measure', model, measure };

    throw new Error(`Unknown element "${reference}" in model ${modelName}`);
  }

  /** List data elements, optionally limited to some models. */
  elements(modelNames?: string[]): SemanticElement[] {
    const selected = modelNames?.length ? modelNames : [...this.models.keys()];
    const result: SemanticElement[] = [];

    for (const modelName of selected) {
      const model = this.models.get(modelName);
      if (!model) throw new Error(`Unknown semantic model: ${modelName}`);

      for (const d of model.dimensions ?? [])
        result.push({
          name: `${model.name}${ELEMENT_SEPARATOR}${d.name}`,
          kind: 'dimension',
          model: model.name,
          table: model.table,
          type: d.type,
          description: d.description,
        });
      for (const m of model.measures ?? [])
        result.push({
          name: `${model.name}${ELEMENT_SEPARATOR}${m.name}`,
          kind: 'measure',
          model: model.name,
          table: model.table,
          description: m.description,
        });
    }

    return result;
  }

  /** Ensure every model's physical table exists in the engine schema. */
  validateAgainstSchema(schema: Schema): void {
    const known = new Set<string>();
    for (const table of schema.tables) {
      const name = table.name.toLowerCase();
      known.add(name);
      known.add(name.split('.').pop()!);
    }

    for (const model of this.models.values()) {
      const table = model.table.toLowerCase();
      if (!known.has(table) && !known.has(table.split('.').pop()!)) {
        throw new Error(`Semantic model "${model.name}" references unknown table "${model.table}"`);
      }
    }
  }
}
