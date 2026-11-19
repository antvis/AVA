import { rm } from 'fs/promises';

import { handleConnection } from './connection';
import { createDataset, describeDataset, disposeDataset, withDataset } from './datasets';
import { startupSchema } from './protocol';
import { createSessionServer, sessionDirectory, sessionEndpoint } from './transport';

import type { Server, Socket } from 'net';
import type { Request } from './protocol';

const id = process.argv[2];
let server: Server | undefined;
let closing: Promise<void> | undefined;
let hasModel = false;
let ready = false;
let idle: ReturnType<typeof setTimeout>;
let pending = 0;

function close(): Promise<void> {
  if (!closing) {
    clearTimeout(idle);
    closing = (async () => {
      try {
        await disposeDataset();
      } finally {
        // Release the dataset first; only then stop accepting new commands.
        server?.close();
        await rm(sessionDirectory(id), { recursive: true, force: true });
      }
    })();
  }

  return closing;
}

async function fail(error: unknown): Promise<void> {
  if (process.connected) process.send?.({ ok: false, error: error instanceof Error ? error.message : String(error) });
  try {
    await close();
  } finally {
    process.exit(1);
  }
}

function resetIdle(): void {
  clearTimeout(idle);
  if (!closing && pending === 0)
    idle = setTimeout(() => {
      void close().catch(fail);
    }, 30 * 60_000);
}

async function dispatch(message: Request, signal: AbortSignal): Promise<unknown> {
  if (closing) throw new Error('Dataset has been disposed.');

  if (message.command === 'dispose') {
    await close();
    return { datasetId: id, disposed: true };
  }

  if (message.command === 'schema') return describeDataset(message.schema);

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
          message.profile === undefined ? undefined : () => message.profile!
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
        return ava.query(message.dsl, { maxRows: message.maxRows, maxResultBytes: message.maxResultBytes }, commandSignal);
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
    exit: (code) => process.exit(code),
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
  if (ready) return;

  // Loading may be blocked on a remote source; bound orphan cleanup.
  const timer = setTimeout(() => {
    void rm(sessionDirectory(id), { recursive: true, force: true }).finally(() => process.exit(1));
  }, 5_000);
  void close().finally(() => {
    clearTimeout(timer);
    process.exit(1);
  });
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    // Graceful first; never let an in-flight task pin the daemon.
    const deadline = setTimeout(() => process.exit(0), 3_000);
    void close().finally(() => {
      clearTimeout(deadline);
      process.exit(0);
    });
  });
}
