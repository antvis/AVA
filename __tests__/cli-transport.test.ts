import { randomBytes } from 'crypto';
import { once } from 'events';
import { rm } from 'fs/promises';
import { createServer, connect } from 'net';
import { join } from 'path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { request } from '../src/cli/session/client';
import {
  connectSession,
  createSessionServer,
  prepareSession,
  readMessage,
  sendResponse,
  sessionEndpoint,
} from '../src/cli/session/transport';

import type { AddressInfo, Server, Socket } from 'net';

const cleanups: (() => Promise<void> | void)[] = [];

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** A connected loopback pair, so framing can be exercised without a session endpoint. */
async function socketPair(): Promise<{ client: Socket; server: Socket }> {
  const listener = createServer();
  await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const { port } = listener.address() as AddressInfo;
  // Register before connecting: the accept can land before the client's own connect event.
  const accepted = once(listener, 'connection');
  const client = connect(port, '127.0.0.1');
  client.on('error', () => {});
  await once(client, 'connect');
  const [server] = (await accepted) as [Socket];
  server.on('error', () => {});

  cleanups.push(async () => {
    client.destroy();
    server.destroy();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  });

  return { client, server };
}

describe('session transport framing', () => {
  it('waits for the newline terminator even when the frame arrives in pieces', async () => {
    const { client, server } = await socketPair();
    const received: string[] = [];
    readMessage(server, Buffer.byteLength('{"command":"schema"}'), (body) => received.push(body));

    client.write('{"command":"sch');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(received).toEqual([]);

    client.write('ema"}');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(received).toEqual([]);

    client.write('\n');
    await vi.waitFor(() => expect(received).toEqual(['{"command":"schema"}']));
  });

  it('reassembles a multi-byte character split across chunks', async () => {
    const { client, server } = await socketPair();
    const received: string[] = [];
    readMessage(server, 1024, (body) => received.push(body));

    // {"q":"中"}\n with 中 (E4 B8 AD) split after its second byte.
    client.write(Buffer.from([0x7b, 0x22, 0x71, 0x22, 0x3a, 0x22, 0xe4, 0xb8]));
    client.write(Buffer.from([0xad, 0x22, 0x7d, 0x0a]));

    await vi.waitFor(() => expect(received).toEqual(['{"q":"中"}']));
  });

  it('delivers a single frame per connection and ignores trailing bytes', async () => {
    const { client, server } = await socketPair();
    const received: string[] = [];
    readMessage(server, 1024, (body) => received.push(body));

    client.write('{"command":"schema"}\n{"command":"dispose"}\n');
    await vi.waitFor(() => expect(received).toEqual(['{"command":"schema"}']));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(received).toHaveLength(1);
  });

  it('drops a frame cut short by EOF', async () => {
    const { client, server } = await socketPair();
    const received: string[] = [];
    readMessage(server, 1024, (body) => received.push(body));

    client.end('{"command":"schema"}');

    await vi.waitFor(() => expect(server.destroyed).toBe(true));
    expect(received).toEqual([]);
  });

  it('destroys the socket when a frame exceeds the limit', async () => {
    const { client, server } = await socketPair();
    const receive = vi.fn();
    const limitError = new Error('Dataset request exceeds 1 MiB.');
    readMessage(server, 8, receive, limitError);

    client.write('0123456789');

    await vi.waitFor(() => expect(server.destroyed).toBe(true));
    expect(receive).not.toHaveBeenCalled();
  });

  it('terminates a response with a newline so the client can frame it', async () => {
    const { client, server } = await socketPair();
    const received: string[] = [];
    readMessage(client, 1024, (body) => received.push(body));

    sendResponse(server, '{"ok":true}');

    await vi.waitFor(() => expect(received).toEqual(['{"ok":true}']));
  });
});

// Named pipes cannot signal EOF in one direction, so the half-close behavior is POSIX only.
describe.skipIf(process.platform === 'win32')('session client framing', () => {
  let listener: Server | undefined;
  let id: string;

  afterEach(() => {
    listener?.close();
    listener = undefined;
  });

  async function prepare(): Promise<string> {
    id = `ds_${randomBytes(12).toString('hex')}`;
    const directory = await prepareSession(id);
    cleanups.push(() => rm(directory, { recursive: true, force: true }));
    return join(directory, 'ipc');
  }

  async function serve(frame: string): Promise<{ ended: () => boolean; frame: () => string }> {
    let ended = false;
    let body = '';
    listener = await createSessionServer(id, (socket) => {
      readMessage(socket, 1024, (message) => {
        body = message;
        sendResponse(socket, frame);
      });
      socket.once('end', () => {
        ended = true;
      });
    });
    await new Promise<void>((resolve) => listener!.listen(sessionEndpoint(id), () => resolve()));

    return { ended: () => ended, frame: () => body };
  }

  it('keeps the write side open until the response so a disconnect stays observable', async () => {
    await prepare();
    const session = await serve('{"ok":true}');
    const socket = await connectSession(id, '{"command":"schema"}');
    cleanups.push(() => socket.destroy());

    await vi.waitFor(() => expect(session.frame()).toBe('{"command":"schema"}'));
    expect(session.ended()).toBe(false);

    socket.destroy();
    await vi.waitFor(() => expect(session.ended()).toBe(true));
  });

  it('tells the new client to reload without connecting to an EOF-framed daemon', async () => {
    const legacyEndpoint = await prepare();
    const received = vi.fn((socket: Socket) => socket.destroy());
    listener = createServer(received);
    await new Promise<void>((resolve) => listener!.listen(legacyEndpoint, resolve));

    await expect(request(id, { command: 'schema' })).rejects.toThrow('Load it again with ava source.');
    expect(received).not.toHaveBeenCalled();
  });

  it('keeps an EOF-framed client away from the new daemon', async () => {
    const legacyEndpoint = await prepare();
    const session = await serve('{"ok":true}');
    const legacy = connect(legacyEndpoint, () => legacy.end('{"command":"schema"}'));

    // Older clients already map a missing socket to the ava source recovery message.
    await expect(once(legacy, 'connect')).rejects.toMatchObject({ code: 'ENOENT' });
    expect(session.frame()).toBe('');
  });
});
