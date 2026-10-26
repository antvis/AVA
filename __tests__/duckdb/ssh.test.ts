import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { setImmediate } from 'node:timers/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSshTunnel } from '../../src/duckdb/util/ssh';

import type { Socket } from 'node:net';
import type { Client, ClientChannel } from 'ssh2';
import type { SSHTunnel } from '../../src/duckdb/util/ssh';

const mocks = vi.hoisted(() => ({
  accept: undefined as ((socket: Socket) => void) | undefined,
  client: undefined as Client | undefined,
  server: {
    listening: false,
    once: vi.fn(),
    listen: vi.fn(),
    address: vi.fn(),
    close: vi.fn(),
  },
}));

vi.mock('node:net', () => ({
  createServer: vi.fn((accept) => {
    mocks.accept = accept;
    return mocks.server;
  }),
}));

vi.mock('ssh2', () => ({
  Client: vi.fn(function () {
    return mocks.client;
  }),
}));

let tunnel: SSHTunnel | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  tunnel = undefined;
  const client = Object.assign(new EventEmitter(), {
    connect: vi.fn(() => {
      queueMicrotask(() => client.emit('ready'));
      return client;
    }),
    forwardOut: vi.fn(),
    end: vi.fn(),
  });
  mocks.client = client as unknown as Client;
  mocks.server.listening = false;
  mocks.server.once.mockReturnValue(mocks.server);
  mocks.server.listen.mockImplementation((_port, _host, onListening) => {
    mocks.server.listening = true;
    onListening();
    return mocks.server;
  });
  mocks.server.address.mockReturnValue({ port: 12345 });
  mocks.server.close.mockImplementation((onClose) => {
    mocks.server.listening = false;
    onClose();
  });
});

afterEach(async () => {
  await tunnel?.close();
  await setImmediate();
});

async function acceptConnection() {
  tunnel = await createSshTunnel({ host: 'bastion', user: 'reader' }, 'database', 3306);
  const socket = new PassThrough();
  const stream = new PassThrough();
  mocks.accept!(socket as unknown as Socket);
  const forward = vi.mocked(mocks.client!.forwardOut).mock.calls[0][4];
  const connect = () => forward(undefined, stream as unknown as ClientChannel);
  return { socket, stream, forward, connect };
}

describe('createSshTunnel', () => {
  it('forwards connections to the requested database through a loopback port', async () => {
    const { socket, stream, connect } = await acceptConnection();
    const socketPipe = vi.spyOn(socket, 'pipe');
    const streamPipe = vi.spyOn(stream, 'pipe');
    connect();
    expect(tunnel.localPort).toBe(12345);
    expect(mocks.server.listen).toHaveBeenCalledWith(0, '127.0.0.1', expect.any(Function));
    expect(mocks.client.forwardOut).toHaveBeenCalledWith('127.0.0.1', 0, 'database', 3306, expect.any(Function));
    expect(socketPipe).toHaveBeenCalledWith(stream);
    expect(streamPipe).toHaveBeenCalledWith(socket);
  });

  it('closes the socket without an unhandled error when forwarding fails', async () => {
    const { socket, forward } = await acceptConnection();
    forward(new Error('forwarding failed'), undefined);
    await setImmediate();
    expect(socket.destroyed).toBe(true);
  });

  it.each(['socket', 'stream'] as const)('handles %s errors and closes both sides', async (side) => {
    const connection = await acceptConnection();
    connection.connect();
    expect(() => connection[side].emit('error', new Error('connection reset'))).not.toThrow();
    await setImmediate();
    expect(connection.socket.destroyed).toBe(true);
    expect(connection.stream.destroyed).toBe(true);
  });

  it.each(['socket', 'stream'] as const)('closes the other side when the %s closes', async (side) => {
    const connection = await acceptConnection();
    connection.connect();
    connection[side].destroy();
    await setImmediate();
    expect(connection.socket.destroyed).toBe(true);
    expect(connection.stream.destroyed).toBe(true);
  });

  it('destroys a channel returned after the local socket has already closed', async () => {
    const { socket, stream, connect } = await acceptConnection();
    socket.destroy();
    await setImmediate();
    const pipe = vi.spyOn(stream, 'pipe');
    connect();
    expect(stream.destroyed).toBe(true);
    expect(pipe).not.toHaveBeenCalled();
  });

  it('closes active connections, the listening server and the SSH client on cleanup', async () => {
    const { socket, stream, connect } = await acceptConnection();
    connect();
    await tunnel.close();
    await setImmediate();
    expect(socket.destroyed).toBe(true);
    expect(stream.destroyed).toBe(true);
    expect(mocks.server.close).toHaveBeenCalledOnce();
    expect(mocks.client.end).toHaveBeenCalledOnce();
    tunnel = undefined;
  });
});
