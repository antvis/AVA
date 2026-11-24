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
  // Keep the write side open: a client that half-closes up front gives the daemon no way to
  // notice that the caller gave up (the peer's FIN has already been consumed as the request frame).
  socket.once('connect', () => socket.write(request + '\n'));
  return socket;
}

// One JSON message per connection, newline framed on every platform: JSON bodies never contain a
// raw newline, and keeping the write side open lets a half-open peer be detected as a disconnect.
export function readMessage(socket: Socket, limit: number, receive: (body: string) => void, limitError?: Error): void {
  let body = '';
  let bytes = 0;
  let received = false;
  const finish = () => {
    if (received) return;
    received = true;
    receive(body);
  };
  socket.setEncoding('utf8');
  socket.on('data', (chunk: string) => {
    if (received) return;
    bytes += Buffer.byteLength(chunk);
    if (bytes > limit + 1) {
      socket.destroy(limitError);
      return;
    }
    const end = chunk.indexOf('\n');
    body += end === -1 ? chunk : chunk.slice(0, end);
    if (end !== -1) finish();
  });
  // Accept an EOF-terminated frame from a peer that half-closes without a terminator (older POSIX clients).
  // Windows pipes keep their previous behavior: an incomplete frame is dropped instead of parsed.
  socket.once('end', () => {
    if (!windows) {
      finish();
      return;
    }
    if (!received) socket.destroy();
  });
}

export function sendResponse(socket: Socket, response: string): void {
  socket.end(response + '\n');
}
