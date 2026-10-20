import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AVA } from '../../lib/index.js';
import { parseSemanticConfig } from '../../lib/semantic/schema.js';
import { logicalType } from '../../lib/duckdb/profile.js';
import type { DataSourceConfig, Schema, SemanticConfig, SemanticDimension, SemanticMeasure, SemanticMetric } from '../../lib/index.js';

export const SEMANTIC_GENERATOR = 'schema-v2';
export type SemanticConfigs = Record<string, { config: SemanticConfig; sha256: string; source?: string }>;

/** Explicit benchmark configs fail closed; missing files must not change the experiment. */
export function loadSemanticFiles(
  samples: { suite: string; dataPath: string }[],
  directory = fileURLToPath(new URL('../databench/semantics/', import.meta.url))
): SemanticConfigs {
  const configs: SemanticConfigs = {};
  for (const { suite, dataPath } of samples) {
    if (!/^[A-Za-z0-9_-]+$/.test(suite)) throw new Error(`Invalid semantic database name: ${suite}`);
    const source = join(directory, `${suite}.yaml`);
    if (configs[dataPath]) {
      if (configs[dataPath].source !== source) throw new Error(`Conflicting semantic files for ${dataPath}`);
      continue;
    }
    const bytes = readFileSync(source);
    const config = parseSemanticConfig(bytes.toString('utf8'));
    configs[dataPath] = { config, source, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  return configs;
}

function nameAllocator() {
  const used = new Set<string>();
  return (physical: string) => {
    const base = physical.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^(?=[0-9])/, '_') || '_';
    let name = base;
    for (let suffix = 2; used.has(name.toLowerCase()); suffix++) name = `${base}${base.endsWith('_') ? '' : '_'}${suffix}`;
    used.add(name.toLowerCase());
    return name;
  };
}

/** No questions, reference SQL or answers are inputs to the generator. */
export function semanticFromSchema(schema: Schema): SemanticConfig {
  const modelName = nameAllocator();
  const names = new Map<string, string>();
  const models = schema.tables.map((table) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*){0,2}$/.test(table.name)) {
      throw new Error(`Semantic compiler does not support physical table name: ${table.name}`);
    }
    const name = modelName(table.name);
    names.set(table.name, name);
    const elementName = nameAllocator();
    const elements: SemanticDimension[] = table.fields.map((field) => {
      const type = logicalType(field.type);
      return {
        name: elementName(field.name), column: field.name,
        description: `${table.name}.${field.name} (${field.type})`,
        ...(type === 'unknown' ? {} : { type: type === 'numeric' ? 'number' as const : type === 'date' ? 'time' as const : type }),
      };
    });
    const dimensions = elements.filter((element) => element.type !== 'number');
    const measures: SemanticMeasure[] = elements.filter((element) => element.type === 'number');
    const metrics: SemanticMetric[] = [{ name: elementName('row_count'), agg: 'count', description: 'Number of rows' }];
    for (const field of table.fields) {
      if (logicalType(field.type) !== 'numeric') continue;
      for (const agg of ['sum', 'avg', 'min', 'max', 'count_distinct'] as const) {
        metrics.push({ name: elementName(`${agg}_${field.name}`), agg, column: field.name,
          description: `${agg} of ${table.name}.${field.name}` });
      }
    }
    return { name, table: table.name, dimensions, measures, metrics };
  });
  const joins = (schema.relations ?? []).map((relation) => {
    const from = names.get(relation.from.table);
    const to = names.get(relation.to.table);
    if (!from || !to || from === to || !relation.from.columns.length || relation.from.columns.length !== relation.to.columns.length) {
      throw new Error(`Unsupported semantic foreign key: ${JSON.stringify(relation)}`);
    }
    return { from, to, type: 'left' as const,
      keys: relation.from.columns.map((column, i) => ({ from: column, to: relation.to.columns[i] })) };
  });
  return { dialect: 'duckdb', models, joins };
}

/** Prepare once per data source before model calls; also validates the generated registry. */
export async function prepareSemantics(paths: string[], type: 'parquet' | 'sqlite'): Promise<SemanticConfigs> {
  const configs: SemanticConfigs = {};
  const ava = new AVA({ engine: { type: 'duckdb' }, llm: { model: 'semantic-preflight-no-model-call' } });
  try {
    for (const path of [...new Set(paths)].sort()) {
      await ava.source({ type, options: { path } } as DataSourceConfig);
      const config = semanticFromSchema(await ava.schema());
      ava.semantic(config);
      configs[path] = { config, sha256: createHash('sha256').update(JSON.stringify(config)).digest('hex') };
    }
  } finally {
    await ava.dispose();
  }
  return configs;
}

export function semanticResources(configs: SemanticConfigs) {
  return Object.fromEntries(Object.entries(configs).map(([path, value]) => [`semantic:${path}`, value.sha256]));
}
