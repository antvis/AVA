import { fork } from 'child_process';
import { randomBytes } from 'crypto';
import { once } from 'events';
import { rm } from 'fs/promises';
import { basename, extname, join } from 'path';

import {
  IPC_TIMEOUT_MS,
  IPC_MAX_REQUEST_BYTES,
  IPC_MAX_RESPONSE_BYTES,
  responseSchema,
  startupSchema,
} from './protocol';
import { connectSession, prepareSession, readMessage } from './transport';

import type { Request } from './protocol';
import type { DataSourceConfig, EngineConfig, LLMConfig } from '../../types';

/**
 * Combine a sanitized source name with a random suffix to identify a dataset session.
 */
function createDatasetId(config: DataSourceConfig): string {
  const { options } = config;
  const source = 'path' in options && typeof options.path === 'string' ? options.path : config.type;
  const path = /^https?:\/\//i.test(source) ? new URL(source).pathname : source;
  const name =
    basename(path, extname(path))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 16)
      .replace(/^-+|-+$/g, '') || 'dataset';

  return `ds_${name}_${randomBytes(6).toString('hex')}`;
}

export async function createSession(
  config: DataSourceConfig,
  llm: LLMConfig,
  engine?: EngineConfig['type']
): Promise<{ datasetId: string }> {
  const startup = startupSchema.parse({ source: config, llm, engine });

  const datasetId = createDatasetId(config);
  const directory = await prepareSession(datasetId);
  let child: ReturnType<typeof fork> | undefined;

  try {
    child = fork(join(__dirname, 'server.js'), [datasetId], {
      detached: true,
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      execArgv: [],
    });
    const worker = child;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout>;
      let onExit: () => void;
      let onMessage: (message: unknown) => void;

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.removeListener('error', finish);
        worker.removeListener('exit', onExit);
        worker.removeListener('message', onMessage);
        if (error) reject(error);
        else resolve();
      };

      onExit = () =>
        finish(
          new Error(
            `Dataset process exited before loading completed (${worker.signalCode ?? `exit code ${worker.exitCode}`}).`
          )
        );
      onMessage = (message) => {
        const response = responseSchema.safeParse(message);
        if (!response.success) finish(new Error('Invalid dataset process response.'));
        else if (response.data.ok === false) finish(new Error(response.data.error));
        else finish();
      };
      timer = setTimeout(() => finish(new Error('Data source loading timed out.')), IPC_TIMEOUT_MS);

      worker.once('error', finish);
      worker.once('exit', onExit);
      worker.once('message', onMessage);

      try {
        worker.send(startup, (error) => {
          if (error) finish(error);
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });

    if (child.connected) child.disconnect();
    child.unref();
    return { datasetId };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    try {
      if (child?.pid && child.exitCode === null && child.signalCode === null) {
        const worker = child;
        const exited = once(worker, 'exit');
        const timer = setTimeout(() => worker.kill('SIGKILL'), 5_000);
        try {
          worker.kill();
          await exited;
        } finally {
          clearTimeout(timer);
        }
      }

      await rm(directory, { recursive: true, force: true });
    } catch (cleanupError) {
      failure.message += `\nSession cleanup failed: ${
        cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
      }`;
    }

    throw failure;
  }
}

function sessionError(id: string, error: Error & { code?: string }): Error {
  return ['ENOENT', 'ECONNREFUSED'].includes(error.code ?? '')
    ? new Error(`Dataset "${id}" is unavailable. Load it again with ava source.`)
    : error;
}

export async function request(id: string, message: Request): Promise<unknown> {
  const body = JSON.stringify(message);

  if (Buffer.byteLength(body) > IPC_MAX_REQUEST_BYTES) throw new Error('Dataset request exceeds 1 MiB.');

  const socket = await connectSession(id, body).catch((error: Error) => {
    throw sessionError(id, error);
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => socket.destroy(new Error('Dataset request timed out; the operation may still be running.')),
      IPC_TIMEOUT_MS
    );
    socket.once('close', () => {
      clearTimeout(timer);
      reject(new Error('Dataset connection closed before a complete response was received.'));
    });
    socket.on('error', (error) => reject(sessionError(id, error)));

    readMessage(
      socket,
      IPC_MAX_RESPONSE_BYTES,
      (response) => {
        socket.destroy();
        if (!response) {
          reject(new Error('Dataset connection ended without a response.'));
          return;
        }

        try {
          const parsed = responseSchema.parse(JSON.parse(response));
          if (parsed.ok === false) reject(new Error(parsed.error));
          else resolve(parsed.result);
        } catch {
          reject(new Error('Dataset returned an invalid or incomplete response.'));
        }
      },
      new Error('Dataset response exceeds 16 MiB.')
    );
  });
}
