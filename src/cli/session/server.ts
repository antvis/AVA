import { rm } from 'fs/promises';

import { runWithTimeout } from '../../util/timeout';

import { handleConnection } from './connection';
import { createDataset, describeDataset, disposeDataset, withDataset } from './datasets';
import { startupSchema } from './protocol';
import { createSessionServer, sessionDirectory, sessionEndpoint } from './transport';

import type { Server, Socket } from 'net';
import type { Request } from './protocol';

const id = process.argv[2];
const DISPOSE_RESPONSE_TIMEOUT_MS = 2_000;
const DRAIN_TIMEOUT_MS = 1_500;
const STARTUP_SHUTDOWN_TIMEOUT_MS = 5_000;
// Snowflake can spend up to 10 seconds each on cancellation and logout.
const SHUTDOWN_TIMEOUT_MS = 25_000;
let server: Server | undefined;
let closing: Promise<void> | undefined;
let hasModel = false;
let ready = false;
let idle: ReturnType<typeof setTimeout>;
let pending = 0;

function close(exitCode = 0): Promise<void> {
  if (!closing) {
    clearTimeout(idle);
    const cleanup = disposeDataset();
    const deadline = setTimeout(() => process.exit(1), ready ? SHUTDOWN_TIMEOUT_MS : STARTUP_SHUTDOWN_TIMEOUT_MS);
    const response = runWithTimeout(cleanup, DISPOSE_RESPONSE_TIMEOUT_MS, {
      onTimeout: () => new Error(`Dataset cleanup timed out after ${DISPOSE_RESPONSE_TIMEOUT_MS} ms.`),
    });
    let drained = Promise.resolve();
    const retire = async () => {
      const listener = server;
      if (listener?.listening) {
        drained = new Promise<void>((resolve) => listener.close(() => resolve()));
      }
      await rm(sessionDirectory(id), { recursive: true, force: true });
    };
    const retired = response.then(retire, retire);
    closing = Promise.all([response, retired]).then(() => undefined);
    void closing.catch(() => {});

    const waitForConnections = retired.finally(() =>
      runWithTimeout(drained, DRAIN_TIMEOUT_MS, {
        onTimeout: () => new Error('Dataset connections did not drain.'),
      }).catch(() => {})
    );
    void Promise.allSettled([cleanup, waitForConnections]).then((results) => {
      clearTimeout(deadline);
      process.exit(results.some((result) => result.status === 'rejected') ? 1 : exitCode);
    });
  }

  return closing;
}

function fail(error: unknown): void {
  if (process.connected) process.send?.({ ok: false, error: error instanceof Error ? error.message : String(error) });
  void close(1);
}

function resetIdle(): void {
  clearTimeout(idle);
  if (!closing && pending === 0)
    idle = setTimeout(() => {
      void close();
    }, 30 * 60_000);
}

async function dispatch(message: Request, signal: AbortSignal): Promise<unknown> {
  if (message.command === 'dispose') {
    await close();
    return { datasetId: id, disposed: true };
  }

  if (closing) throw new Error('Dataset has been disposed.');

  if (message.command === 'schema') return describeDataset(message.schema, signal);

  if (['suggest', 'analyze', 'translate'].includes(message.command) && !hasModel) {
    throw new Error('Set OPENAI_API_KEY before ava source, then load the dataset again.');
  }

  return withDataset(async (ava, commandSignal) => {
    switch (message.command) {
      case 'semantic':
        return ava.semantic(undefined, message.semantic === undefined ? undefined : () => message.semantic!);
      case 'profile':
        return ava.profile(
          { metrics: message.metrics },
          message.profile === undefined ? undefined : () => message.profile!,
          commandSignal
        );
      case 'suggest':
        return ava.suggest(message.count, commandSignal);
      case 'translate':
        return { dsl: await ava.translate(message.query, commandSignal) };
      case 'analyze':
        return ava.analyze(
          message.query,
          {
            ...(message.strategy ? { strategy: { type: message.strategy } } : {}),
            maxRows: message.maxRows,
            maxResultBytes: message.maxResultBytes,
          },
          commandSignal
        );
      case 'query':
        return ava.query(
          message.dsl,
          { maxRows: message.maxRows, maxResultBytes: message.maxResultBytes },
          commandSignal
        );
    }
  }, signal);
}

function trackBusy(busy: boolean): void {
  if (busy) {
    pending++;
    clearTimeout(idle);
    return;
  }

  pending--;
  resetIdle();
}

function serveConnection(socket: Socket): void {
  handleConnection(socket, {
    dispatch,
    onBusy: trackBusy,
  });
}

process.once('message', (message) => {
  void (async () => {
    const startup = startupSchema.parse(message);
    hasModel = Boolean(startup.llm.apiKey);
    await createDataset(startup.sources, { ...startup.llm, model: startup.llm.model }, startup.engine);
    if (closing) return;

    server = await createSessionServer(id, serveConnection);
    if (closing) return;
    server.on('error', (error) => void fail(error));

    server.listen(sessionEndpoint(id), () => {
      if (closing) return;
      ready = true;
      resetIdle();
      process.send?.({ ok: true, result: null }, (error) => {
        if (error) void fail(error);
      });
    });
  })().catch(fail);
});

process.once('disconnect', () => {
  if (!ready) void close(1);
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void close();
  });
}
