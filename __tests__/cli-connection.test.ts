import { EventEmitter } from 'events';

import { describe, expect, it, vi } from 'vitest';

import { DISPOSE_EXIT_DEADLINE_MS, handleConnection } from '../src/cli/session/connection';

import type { Socket } from 'net';

/** Minimal socket double: enough surface for readMessage/sendResponse and the disconnect hooks. */
class FakeSocket extends EventEmitter {
  destroyed = false;
  written: string[] = [];
  timeouts: number[] = [];
  /** Set to false to simulate a client that never drains the response. */
  flushes = true;

  setTimeout(ms: number): this {
    this.timeouts.push(ms);
    return this;
  }

  setEncoding(): this {
    return this;
  }

  destroy(): this {
    if (this.destroyed) return this;
    this.destroyed = true;
    this.emit('close');
    return this;
  }

  end(chunk?: string): this {
    if (chunk) this.written.push(chunk);
    if (this.flushes) this.emit('finish');
    return this;
  }
}

function connect(): { socket: FakeSocket; net: Socket } {
  const socket = new FakeSocket();
  return { socket, net: socket as unknown as Socket };
}

describe('session connection', () => {
  it('aborts the running command as soon as the client disconnects', async () => {
    const { socket, net } = connect();
    let signal: AbortSignal | undefined;
    const dispatch = vi.fn((_message: unknown, received: AbortSignal) => {
      signal = received;
      return new Promise(() => {});
    });

    handleConnection(net, { dispatch });
    socket.emit('data', '{"command":"analyze","query":"Which region?"}\n');

    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledOnce());
    expect(signal?.aborted).toBe(false);

    socket.emit('end');

    expect(signal?.aborted).toBe(true);
    expect(socket.destroyed).toBe(true);
  });

  it('drops the response for a command whose client already left', async () => {
    const { socket, net } = connect();
    let release: ((value: unknown) => void) | undefined;
    const dispatch = vi.fn(() => new Promise((resolve) => (release = resolve)));

    handleConnection(net, { dispatch });
    socket.emit('data', '{"command":"schema"}\n');
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledOnce());

    socket.emit('end');
    release!({ models: [] });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(socket.written).toEqual([]);
  });

  it('tracks busy state for the idle timer', async () => {
    const { socket, net } = connect();
    const onBusy = vi.fn();

    handleConnection(net, { dispatch: vi.fn().mockResolvedValue({ ok: 1 }), onBusy });
    socket.emit('data', '{"command":"profile"}\n');

    await vi.waitFor(() => expect(onBusy).toHaveBeenCalledTimes(2));
    expect(onBusy.mock.calls).toEqual([[true], [false]]);
  });

  it('exits once the dispose response is flushed', async () => {
    const { socket, net } = connect();
    const exit = vi.fn();

    handleConnection(net, { dispatch: vi.fn().mockResolvedValue({ disabled: true, disposed: true }), exit });
    socket.emit('data', '{"command":"dispose"}\n');

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(socket.written).toHaveLength(1);
    expect(JSON.parse(socket.written[0].trim())).toEqual({ ok: true, result: { disabled: true, disposed: true } });
  });

  it('bounds the exit of an unflushed dispose response', async () => {
    vi.useFakeTimers();
    try {
      const { socket, net } = connect();
      const exit = vi.fn();
      socket.flushes = false;

      handleConnection(net, { dispatch: vi.fn().mockResolvedValue({ disposed: true }), exit });
      socket.emit('data', '{"command":"dispose"}\n');
      await vi.advanceTimersByTimeAsync(0);

      expect(exit).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(DISPOSE_EXIT_DEADLINE_MS);
      expect(exit).toHaveBeenCalledWith(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('answers an invalid request with an error instead of running it', async () => {
    const { socket, net } = connect();
    const dispatch = vi.fn();

    handleConnection(net, { dispatch });
    socket.emit('data', '{"command":"nope"}\n');

    await vi.waitFor(() => expect(socket.written).toHaveLength(1));
    expect(dispatch).not.toHaveBeenCalled();
    expect(JSON.parse(socket.written[0].trim())).toMatchObject({ ok: false });
  });
});
