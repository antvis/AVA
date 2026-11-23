import { AVA } from '../..';
import { createAbortError, throwIfAborted } from '../../util/abort';

import type { DataSourceConfig, Schema, EngineConfig, LLMConfig } from '../../types';

// One server process owns one dataset. The socket path supplies its external ID.
let ava: AVA | undefined;
let loading = Promise.resolve();
let queue = loading;
let disposal: Promise<void> | undefined;
const lifetime = new AbortController();

export function disposeDataset(): Promise<void> {
  if (!disposal) {
    const instance = ava;
    ava = undefined;
    disposal = Promise.resolve().then(async () => {
      lifetime.abort(createAbortError('Dataset has been disposed.'));
      // The engine still owns initialization until load settles. Running commands are cancelled independently.
      await loading;
      return instance?.dispose();
    });
  }

  return disposal;
}

export async function createDataset(
  sources: DataSourceConfig[],
  llm: LLMConfig,
  engine?: EngineConfig['type']
): Promise<void> {
  if (ava || disposal) throw new Error('Dataset process has already been initialized.');

  const remote = sources.find(({ type }) => ['supabase', 'clickhouse', 'sqlserver', 'snowflake'].includes(type));
  ava = new AVA({ llm, engine: { type: engine ?? remote?.type ?? 'duckdb' } });
  const startup = ava.source(sources);
  loading = startup.catch(() => undefined);
  queue = loading;
  await startup;
}

export function withDataset<T>(
  operation: (instance: AVA, signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!ava || disposal) return Promise.reject(new Error('Dataset is unavailable.'));

  const instance = ava;
  const combined = signal ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal;

  const result = queue.then(() => {
    throwIfAborted(combined);
    return operation(instance, combined);
  });

  // Recover the queue so a failed command cannot block subsequent work or disposal.
  queue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}

export async function describeDataset(schema?: Schema, signal?: AbortSignal) {
  return withDataset(async (instance, commandSignal) => {
    const engine = instance.engine!;
    const language = engine.dialect.id;
    if (!language) throw new Error('Query dialect must provide a non-empty id');
    return {
      ...(await instance.schema(undefined, schema === undefined ? undefined : () => schema, commandSignal)),
      language,
      ...(engine.dialect.rules ? { instructions: engine.dialect.rules } : {}),
    };
  }, signal);
}
