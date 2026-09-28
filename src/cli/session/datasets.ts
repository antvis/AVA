import { AVA } from '../../index';

import type { DataSourceConfig, LLMConfig } from '../../types';

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

export async function createDataset(source: DataSourceConfig, llm: LLMConfig): Promise<void> {
  if (ava || disposal) throw new Error('Dataset process has already been initialized.');

  ava = new AVA({ llm, engine: { type: source.type === 'supabase' ? 'supabase' : 'duckdb' } });
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
