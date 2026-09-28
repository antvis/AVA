import { fork } from 'child_process';
import { randomBytes } from 'crypto';
import { once } from 'events';
import { mkdir, rm } from 'fs/promises';
import { connect } from 'net';
import { join } from 'path';

import {
  IPC_TIMEOUT_MS,
  IPC_MAX_REQUEST_BYTES,
  IPC_MAX_RESPONSE_BYTES,
  responseSchema,
  sessionDirectory,
  socketPath,
} from './protocol';

import type { Request } from './protocol';
import type { DataSourceConfig, LLMConfig } from '../../types';

export async function createSession(config: DataSourceConfig, llm: LLMConfig): Promise<{ datasetId: string }> {
  // Unix sockets inherit the private directory's access restrictions.
  if (process.platform === 'win32') throw new Error('Dataset sessions currently require macOS or Linux.');
  const datasetId = `ds_${randomBytes(12).toString('hex')}`;
  const directory = sessionDirectory(datasetId);
  await mkdir(directory, { mode: 0o700 });
  let child: ReturnType<typeof fork> | undefined;

  try {
    child = fork(join(__dirname, 'server.js'), [datasetId], {
      detached: true,
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
      execArgv: [],
    });
    const worker = child;
    let startupError = '';
    worker.stderr?.setEncoding('utf8');
    worker.stderr?.on('data', (chunk: string) => {
      startupError = (startupError + chunk).slice(-8192);
    });

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

      onExit = () => finish(new Error(startupError.trim() || 'Dataset process exited before loading completed.'));
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
        worker.send({ source: config, llm }, (error) => {
          if (error) finish(error);
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });

    child.stderr?.destroy();
    if (child.connected) child.disconnect();
    child.unref();
    return { datasetId };
  } catch (error) {
    if (child?.pid && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      const timer = setTimeout(() => child.kill('SIGKILL'), 5_000);
      try {
        child.kill();
        await exited;
      } finally {
        clearTimeout(timer);
      }
    }

    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

export async function request(id: string, message: Request): Promise<unknown> {
  const path = socketPath(id);
  const body = JSON.stringify(message);

  if (Buffer.byteLength(body) > IPC_MAX_REQUEST_BYTES) throw new Error('Dataset request exceeds 1 MiB.');

  return new Promise((resolve, reject) => {
    const socket = connect(path);
    let response = '';
    let bytes = 0;

    socket.setEncoding('utf8');
    const timer = setTimeout(
      () => socket.destroy(new Error('Dataset request timed out; the operation may still be running.')),
      IPC_TIMEOUT_MS
    );
    socket.once('close', () => {
      clearTimeout(timer);
      reject(new Error('Dataset connection closed before a complete response was received.'));
    });
    socket.on('connect', () => socket.end(body));

    socket.on('data', (chunk: string) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > IPC_MAX_RESPONSE_BYTES) socket.destroy(new Error('Dataset response exceeds 16 MiB.'));
      else response += chunk;
    });

    socket.on('error', (error: Error & { code?: string }) => {
      reject(
        ['ENOENT', 'ECONNREFUSED'].includes(error.code ?? '')
          ? new Error(`Dataset "${id}" is unavailable. Load it again with ava source.`)
          : error
      );
    });

    socket.on('end', () => {
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
    });
  });
}
