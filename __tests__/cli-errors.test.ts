import { EventEmitter } from 'events';
import { connect } from 'net';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { request } from '../src/cli/session/client';
import { IPC_TIMEOUT_MS, IPC_MAX_REQUEST_BYTES, IPC_MAX_RESPONSE_BYTES } from '../src/cli/session/protocol';

vi.mock('net', () => ({ connect: vi.fn() }));
const id = 'ds_json_012345abcdef';
class Socket extends EventEmitter {
  setEncoding() {
    return this;
  }
  end() {
    return this;
  }
  destroy(error?: Error) {
    if (error) this.emit('error', error);
    this.emit('close');
    return this;
  }
}
let socket: Socket;
beforeEach(() => {
  socket = new Socket();
  vi.mocked(connect).mockReturnValue(socket as unknown as ReturnType<typeof connect>);
});
afterEach(() => {
  socket.emit('close');
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('session outcomes', () => {
  it.each(['ENOENT', 'ECONNREFUSED'])('marks %s as unavailable without dispatching work', async (code) => {
    const result = request(id, { command: 'schema' });
    socket.emit('error', Object.assign(new Error('native detail'), { code }));
    await expect(result).rejects.toMatchObject({ code: 'DATASET_UNAVAILABLE', outcome: 'failed' });
  });

  it('marks a timeout as unknown rather than assuming cancellation', async () => {
    vi.useFakeTimers();
    const result = request(id, { command: 'dispose' });
    const check = expect(result).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT', outcome: 'unknown' });
    await vi.advanceTimersByTimeAsync(IPC_TIMEOUT_MS);
    await check;
  });

  it.each(['closed', 'reset', 'invalid', 'empty'])('keeps %s transport outcomes unknown', async (kind) => {
    const result = request(id, { command: 'query', dsl: 'SELECT 1' });
    if (kind === 'closed') socket.emit('close');
    if (kind === 'reset') socket.emit('error', Object.assign(new Error('reset'), { code: 'ECONNRESET' }));
    if (kind === 'invalid') {
      socket.emit('data', '{');
      socket.emit('end');
    }
    if (kind === 'empty') socket.emit('end');
    await expect(result).rejects.toMatchObject({ outcome: 'unknown' });
  });

  it('rejects oversized input before connecting and leaves oversized response outcomes unknown', async () => {
    await expect(request(id, { command: 'query', dsl: 'x'.repeat(IPC_MAX_REQUEST_BYTES) })).rejects.toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      outcome: 'failed',
    });
    expect(connect).not.toHaveBeenCalled();
    const response = request(id, { command: 'schema' });
    socket.emit('data', 'x'.repeat(IPC_MAX_RESPONSE_BYTES + 1));
    await expect(response).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE', outcome: 'unknown' });
  });

  it('propagates typed server errors and supports older workers', async () => {
    for (const [response, code] of [
      [{ ok: false, error: 'Source failed', code: 'SOURCE_ERROR', outcome: 'failed' }, 'SOURCE_ERROR'],
      [{ ok: false, error: 'Legacy error' }, 'OPERATION_FAILED'],
    ] as const) {
      const result = request(id, { command: 'schema' });
      socket.emit('data', JSON.stringify(response));
      socket.emit('end');
      await expect(result).rejects.toMatchObject({ code, outcome: 'failed' });
      socket.emit('close');
      socket = new Socket();
      vi.mocked(connect).mockReturnValue(socket as unknown as ReturnType<typeof connect>);
    }
  });
});
