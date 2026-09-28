import { rm } from 'fs/promises';
import { createServer } from 'net';

import { createDataset, disposeDataset, withDataset } from './datasets';
import {
  IPC_TIMEOUT_MS,
  IPC_MAX_REQUEST_BYTES,
  IPC_MAX_RESPONSE_BYTES,
  requestSchema,
  sessionDirectory,
  socketPath,
  startupSchema,
} from './protocol';

import type { Request } from './protocol';

const id = process.argv[2];
let server: ReturnType<typeof createServer>;
let closing: Promise<void> | undefined;
let hasModel = false;
let ready = false;
let idle: ReturnType<typeof setTimeout>;
let pending = 0;

function close(): Promise<void> {
  if (!closing) {
    clearTimeout(idle);
    server.close();
    closing = disposeDataset().finally(() => rm(sessionDirectory(id), { recursive: true, force: true }));
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

async function dispatch(message: Request): Promise<unknown> {
  if (closing) throw new Error('Dataset has been disposed.');

  if (message.command === 'dispose') {
    await close();
    return { datasetId: id, disposed: true };
  }

  if (['suggest', 'analyze', 'translate'].includes(message.command) && !hasModel) {
    throw new Error('Set OPENAI_API_KEY before ava source, then load the dataset again.');
  }

  return withDataset(async (ava) => {
    switch (message.command) {
      case 'schema':
        return ava.schema();
      case 'profile':
        return ava.profile({ metrics: message.metrics });
      case 'suggest':
        return ava.suggest(message.count);
      case 'translate':
        return { dsl: await ava.translate(message.query) };
      case 'analyze':
        return ava.analyze(message.query, {
          ...(message.strategy ? { strategy: { type: message.strategy } } : {}),
          maxRows: message.maxRows,
          maxResultBytes: message.maxResultBytes,
        });
      case 'query':
        return ava.query(message.dsl, { maxRows: message.maxRows, maxResultBytes: message.maxResultBytes });
    }
  });
}

server = createServer({ allowHalfOpen: true }, (socket) => {
  let body = '';
  let bytes = 0;

  socket.setEncoding('utf8');
  socket.setTimeout(IPC_TIMEOUT_MS, () => socket.destroy());
  socket.on('error', () => socket.destroy());

  socket.on('data', (chunk: string) => {
    bytes += Buffer.byteLength(chunk);
    if (bytes > IPC_MAX_REQUEST_BYTES) socket.destroy();
    else body += chunk;
  });

  socket.on('end', () => {
    if (socket.destroyed) return;
    socket.setTimeout(0);
    pending++;
    clearTimeout(idle);

    void (async () => {
      try {
        let response: string;
        try {
          const result = await dispatch(requestSchema.parse(JSON.parse(body)));
          response = JSON.stringify({ ok: true, result });
        } catch (error) {
          response = JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) });
        }

        if (socket.destroyed) return;
        if (Buffer.byteLength(response) > IPC_MAX_RESPONSE_BYTES)
          response = JSON.stringify({ ok: false, error: 'Dataset response exceeds 16 MiB.' });

        socket.setTimeout(IPC_TIMEOUT_MS);
        socket.end(response);
      } finally {
        pending--;
        resetIdle();
      }
    })();
  });
});

server.on('error', (error) => {
  void fail(error);
});

process.once('message', (message) => {
  void (async () => {
    const startup = startupSchema.parse(message);
    hasModel = Boolean(startup.llm.apiKey);
    await createDataset(startup.source, { ...startup.llm, model: startup.llm.model });
    if (closing) return;

    server.listen(socketPath(id), () => {
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
    void close().finally(() => process.exit(0));
  });
}
