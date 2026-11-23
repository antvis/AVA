import { AVA } from '../..';
import { createAbortError, throwIfAborted } from '../../util/abort';
import { runWithTimeout } from '../../util/timeout';

import type { DataSourceConfig, Schema, EngineConfig, LLMConfig } from '../../types';

const DISPOSE_TIMEOUT_MS = 2_000;

// One server process owns one dataset. The socket path supplies its external ID.
let ava: AVA | undefined;
let queue = Promise.resolve();
let disposal: Promise<void> | undefined;
const active = new Set<AbortController>();

/**
 * Abort queued and running commands.
 * Disposal is authoritative: it must not wait for the serial queue to drain.
 */
function cancelActive(): void {
  for (const controller of active) controller.abort(createAbortError('Dataset has been disposed.'));
  active.clear();
}

export function disposeDataset(): Promise<void> {
  if (!disposal) {
    // Release the dataset reference before awaiting so new commands are rejected immediately.
    cancelActive();
    const instance = ava;
    ava = undefined;
    disposal = runWithTimeout(Promise.resolve(instance?.dispose()), DISPOSE_TIMEOUT_MS, {
      onTimeout: () => new Error(`Dataset cleanup timed out after ${DISPOSE_TIMEOUT_MS} ms.`),
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
  const loading = ava.source(sources);
  queue = loading.catch(() => undefined);
  try {
    await loading;
  } catch (error) {
    await disposeDataset();
    throw error;
  }
}

export function withDataset<T>(
  operation: (instance: AVA, signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!ava || disposal) return Promise.reject(new Error('Dataset is unavailable.'));

  const instance = ava;
  const controller = new AbortController();
  active.add(controller);

  // The caller's socket signal and the disposal signal both cancel this command.
  const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

  const result = queue.then(() => {
    throwIfAborted(combined);
    return operation(instance, combined);
  });

  // Recover the queue so a failed command cannot block subsequent work or disposal.
  queue = result.then(
    () => undefined,
    () => undefined
  );

  return result.finally(() => active.delete(controller));
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
