import { AVA } from '../../index';

import type { DataSourceConfig, EngineConfig, LLMConfig, Schema } from '../../types';

/** Sources queried in place by the engine of the same name. */
const REMOTE_SOURCES = new Set<DataSourceConfig['type']>(['supabase', 'clickhouse', 'sqlserver', 'bigquery']);

// One server process owns one dataset. The socket path supplies its external ID.
let ava: AVA | undefined;
let queue = Promise.resolve();
let disposal: Promise<void> | undefined;

export function disposeDataset(): Promise<void> {
  disposal ??= queue.then(async () => {
    try {
      await ava?.dispose();
    } finally {
      ava = undefined;
    }
  });

  return disposal;
}

export async function createDataset(
  source: DataSourceConfig,
  llm: LLMConfig,
  engine?: EngineConfig['type']
): Promise<void> {
  if (ava || disposal) throw new Error('Dataset process has already been initialized.');

  ava = new AVA({
    llm,
    engine: { type: engine ?? (REMOTE_SOURCES.has(source.type) ? source.type : 'duckdb') },
  });
  const loading = ava.source(source);
  queue = loading.catch(() => undefined);
  try {
    await loading;
  } catch (error) {
    await disposeDataset();
    throw error;
  }
}

export function withDataset<T>(operation: (instance: AVA) => Promise<T>): Promise<T> {
  if (!ava || disposal) return Promise.reject(new Error('Dataset is unavailable.'));

  const instance = ava;
  const result = queue.then(() => operation(instance));

  // Recover the queue so a failed command cannot block subsequent work or disposal.
  queue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}

export async function describeDataset(schema?: Schema) {
  return withDataset(async (instance) => ({
    ...(await instance.schema(undefined, schema === undefined ? undefined : () => schema)),
    language: instance.engine!.language,
  }));
}
