import { basename, extname, join } from 'node:path';
import { integer } from '../_shared/args.js';
import { atomicJson } from '../_shared/files.js';
import { loadSemanticFiles, prepareSemantics, semanticResources, SEMANTIC_GENERATOR } from './semantic.ts';
import type { AVA, AnalysisStrategyConfig, DataSourceConfig } from '../../lib/index.js';

export const strategyOptions = {
  strategy: { type: 'string', default: 'direct' },
  'max-steps': { type: 'string' },
  'max-retries': { type: 'string', default: '2' },
} as const;

type StrategyOptions = { strategy: string; 'max-steps'?: string; 'max-retries'?: string; engine?: string };
type StrategySources =
  | { type: 'parquet'; samples: { suite: string; dataPath: string }[] }
  | { type: 'sqlite'; paths: string[]; semanticDirectory?: string };

export interface PreparedStrategy {
  config: AnalysisStrategyConfig;
  manifest: Record<string, unknown>;
  modelContext: string;
  resources: Record<string, string>;
  saveArtifacts(directory: string): void;
  setup(ava: AVA, source: DataSourceConfig): void | Promise<void>;
  record(path: string): Record<string, unknown>;
}

type StrategyDefinition = {
  config(options: StrategyOptions): AnalysisStrategyConfig;
  prepare?(options: StrategyOptions, sources: StrategySources): Promise<Partial<Omit<PreparedStrategy, 'config'>>>;
};

const strategies: Record<AnalysisStrategyConfig['type'], StrategyDefinition> = {
  direct: {
    config: (options) => ({ type: 'direct', maxRetries: integer(options['max-retries'] ?? '2', 'max-retries', 0) }),
  },
  loop: {
    config: (options) => ({ type: 'loop', maxSteps: integer(options['max-steps'] ?? '12', 'max-steps') }),
  },
  subset: {
    config: () => ({ type: 'subset' }),
  },
  semantic: {
    config: (options) => ({ type: 'semantic', maxSteps: integer(options['max-steps'] ?? '20', 'max-steps') }),
    async prepare(options, sources) {
      if (options.engine && options.engine !== 'duckdb') throw new Error('semantic requires --engine duckdb');
      const explicit = sources.type === 'parquet' || !!sources.semanticDirectory;
      const semantics = sources.type === 'parquet'
        ? loadSemanticFiles(sources.samples)
        : sources.semanticDirectory
          ? loadSemanticFiles(sources.paths.map((dataPath) => ({
            suite: basename(dataPath, extname(dataPath)), dataPath,
          })), sources.semanticDirectory)
          : await prepareSemantics(sources.paths, 'sqlite');
      return {
        manifest: { semanticProtocol: 'smq-v4', semanticGenerator: explicit ? 'file-v3' : SEMANTIC_GENERATOR },
        modelContext: explicit ? 'explicit semantic files' : 'schema-derived semantic tools',
        resources: semanticResources(semantics),
        saveArtifacts: (directory) => atomicJson(join(directory, 'semantic.json'), semantics),
        setup(ava, source) {
          const config = (source.type === 'parquet' || source.type === 'sqlite') && semantics[source.options.path]?.config;
          if (!config) throw new Error('Missing semantic config for this data source');
          ava.semantic(config);
        },
        record: (path) => ({ semantic_sha256: semantics[path]?.sha256 }),
      };
    },
  },
};

export const strategyHelp = `  --strategy <name>       ${Object.keys(strategies).join(', ')} (default direct)
  --max-retries <number>  Direct execution retries (default 2)
  --max-steps <number>    Action budget (loop: 12, semantic: 20)
  --thinking <mode>      provider (default), on, off; on/off requires enable_thinking support
  --temperature <n>      Sampling temperature (semantic strategy)
  --max-output-tokens <n> Output token budget (semantic strategy)`;

/** Prepare shared resources once; setup receives only the current data source, never gold answers. */
export async function prepareStrategy(options: StrategyOptions, sources: StrategySources): Promise<PreparedStrategy> {
  if (!Object.hasOwn(strategies, options.strategy)) {
    throw new Error(`--strategy must be ${Object.keys(strategies).join(', ')}`);
  }
  const definition = strategies[options.strategy as AnalysisStrategyConfig['type']];
  const config = definition.config(options);
  const prepared = await definition.prepare?.(options, sources);
  return {
    config,
    modelContext: 'ava-profile',
    resources: {},
    saveArtifacts() {},
    setup() {},
    record: () => ({}),
    ...prepared,
    manifest: { strategy: config, semanticGenerator: null, ...prepared?.manifest },
  };
}
