import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { semanticMetadataSchema } from '../../lib/util/data-model.js';
import { integer } from '../_shared/args.js';
import type { AVA, AnalysisConfig, AnalysisStrategyConfig, DataSourceConfig, Semantic } from '../../lib/index.js';
import type { Metadata } from './metadata.ts';

export function readStrategy(values: { strategy: string; 'max-retries': string; 'max-steps': string }): AnalysisStrategyConfig {
  switch (values.strategy) {
    case 'direct': return { type: 'direct', maxRetries: integer(values['max-retries'], 'max-retries', 0) };
    case 'loop': return { type: 'loop', maxSteps: integer(values['max-steps'], 'max-steps') };
    case 'subset': return { type: 'subset' };
    default: throw new Error('--strategy must be direct, loop or subset');
  }
}

export function readSemantic(path: string): Semantic | undefined {
  if (!existsSync(path)) return undefined;
  return semanticMetadataSchema.parse(parse(readFileSync(path, 'utf8')));
}

export async function workflow(
  ava: AVA,
  source: DataSourceConfig,
  query: string,
  config: AnalysisConfig = {},
  semantic?: Semantic,
  loadMetadata?: () => Promise<Metadata>,
) {
  await ava.source(source);
  if (loadMetadata) {
    const { schema, profile } = await loadMetadata();
    await ava.schema(undefined, () => schema);
    await ava.profile(undefined, () => profile);
  } else {
    await ava.profile();
  }
  if (semantic) await ava.semantic(undefined, () => semantic);
  return ava.analyze(query, config);
}
