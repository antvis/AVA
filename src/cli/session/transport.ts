import { mkdir, rm } from 'fs/promises';
import { connect, createServer } from 'net';
import { homedir, tmpdir } from 'os';
import { dirname, join } from 'path';

import { connectPipe, createPipeKey, createPipeServer } from './windows';

import type { Socket } from 'net';

const windows = process.platform === 'win32';

export function sessionDirectory(id: string): string {
  if (!/^ds_(?:[a-f0-9]{24}|[a-z0-9][a-z0-9-]{0,15}_[a-f0-9]{12})$/.test(id)) throw new Error('Invalid dataset ID.');

  const root = windows ? join(homedir(), '.ava', 'sessions') : tmpdir();
  return join(root, 'ava-' + id);
}

export function sessionEndpoint(id: string): string {
  const directory = sessionDirectory(id);
  return windows ? '\\\\.\\pipe\\ava-' + id : join(directory, 'ipc');
}

export async function prepareSession(id: string): Promise<string> {
  const directory = sessionDirectory(id);
  if (windows) await mkdir(dirname(directory), { recursive: true });
  await mkdir(directory, { mode: 0o700 });

  if (windows) {
    try {
      await createPipeKey(directory);
    } catch (error) {
      await rm(directory, { recursive: true, force: true });
      throw error;
    }
  }
  return directory;
}

export async function createSessionServer(id: string, onConnection: (socket: Socket) => void) {
  if (windows) return createPipeServer(sessionDirectory(id), onConnection);
  return createServer({ allowHalfOpen: true }, onConnection);
}

export async function connectSession(id: string, request: string): Promise<Socket> {
  const endpoint = sessionEndpoint(id);
  if (windows) {
    const socket = await connectPipe(endpoint, sessionDirectory(id));
    socket.once('secureConnect', () => socket.write(request + '\n'));
    return socket;
  }
  const socket = connect(endpoint);
  socket.once('connect', () => socket.end(request));
  return socket;
}

// Windows pipes cannot signal EOF in one direction while keeping the other
// open. Frame one JSON message per connection, preserving Unix EOF framing.
export function readMessage(socket: Socket, limit: number, receive: (body: string) => void, limitError?: Error): void {
  let body = '';
  let bytes = 0;
  let received = false;
  socket.setEncoding('utf8');
  socket.on('data', (chunk: string) => {
    if (received) return;
    bytes += Buffer.byteLength(chunk);
    if (bytes > limit + Number(windows)) {
      socket.destroy(limitError);
      return;
    }
    body += chunk;
    if (windows && body.endsWith('\n')) {
      received = true;
      receive(body.slice(0, -1));
    }
  });
  socket.once('end', () => {
    if (!windows) receive(body);
    else if (!received) socket.destroy();
  });
}

export function sendResponse(socket: Socket, response: string): void {
  socket.end(windows ? response + '\n' : response);
}
