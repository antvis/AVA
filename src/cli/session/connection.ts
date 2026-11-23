import { IPC_TIMEOUT_MS, IPC_MAX_REQUEST_BYTES, IPC_MAX_RESPONSE_BYTES, requestSchema } from './protocol';
import { readMessage, sendResponse } from './transport';

import type { Socket } from 'net';
import type { Request } from './protocol';

export interface ConnectionHooks {
  /** Run one validated command. The signal aborts as soon as the client goes away. */
  dispatch(message: Request, signal: AbortSignal): Promise<unknown>;
  /** Reports command start (`true`) and completion (`false`) so the host can track idleness. */
  onBusy?(busy: boolean): void;
}

/**
 * Serve a single client connection: one framed request per connection.
 *
 * The client keeps its write side open until the response arrives, so EOF means it gave up — the
 * command is aborted instead of being finished and thrown away.
 */
export function handleConnection(socket: Socket, hooks: ConnectionHooks): void {
  socket.setTimeout(IPC_TIMEOUT_MS, () => socket.destroy());
  socket.on('error', () => socket.destroy());

  const controller = new AbortController();
  const abandon = () => {
    controller.abort();
    socket.destroy();
  };
  socket.once('end', abandon);
  socket.once('close', abandon);

  readMessage(socket, IPC_MAX_REQUEST_BYTES, (body) => {
    if (socket.destroyed) return;
    socket.setTimeout(0);
    hooks.onBusy?.(true);

    void (async () => {
      try {
        let response: string;
        try {
          const request = requestSchema.parse(JSON.parse(body));
          const result = await hooks.dispatch(request, controller.signal);
          response = JSON.stringify({ ok: true, result });
        } catch (error) {
          response = JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) });
        }

        if (socket.destroyed) return;
        if (Buffer.byteLength(response) > IPC_MAX_RESPONSE_BYTES)
          response = JSON.stringify({ ok: false, error: 'Dataset response exceeds 16 MiB.' });

        socket.setTimeout(IPC_TIMEOUT_MS);
        sendResponse(socket, response);
      } finally {
        hooks.onBusy?.(false);
      }
    })();
  });
}
