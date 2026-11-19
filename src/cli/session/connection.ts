import { IPC_TIMEOUT_MS, IPC_MAX_REQUEST_BYTES, IPC_MAX_RESPONSE_BYTES, requestSchema } from './protocol';
import { readMessage, sendResponse } from './transport';

import type { Socket } from 'net';
import type { Request } from './protocol';

/** How long a dispose response may stay unflushed before the host is told to exit anyway. */
export const DISPOSE_EXIT_DEADLINE_MS = 1_500;

export interface ConnectionHooks {
  /** Run one validated command. The signal aborts as soon as the client goes away. */
  dispatch(message: Request, signal: AbortSignal): Promise<unknown>;
  /** Reports command start (`true`) and completion (`false`) so the host can track idleness. */
  onBusy?(busy: boolean): void;
  /** Terminates the host process, used once a dispose response can no longer be improved on. */
  exit?(code: number): void;
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
      let command: Request['command'] | undefined;
      try {
        let response: string;
        try {
          const request = requestSchema.parse(JSON.parse(body));
          command = request.command;
          const result = await hooks.dispatch(request, controller.signal);
          response = JSON.stringify({ ok: true, result });
        } catch (error) {
          response = JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) });
        }

        if (socket.destroyed) return;
        if (Buffer.byteLength(response) > IPC_MAX_RESPONSE_BYTES)
          response = JSON.stringify({ ok: false, error: 'Dataset response exceeds 16 MiB.' });

        socket.setTimeout(IPC_TIMEOUT_MS);
        if (command === 'dispose') {
          // Exit after the response is flushed, with a deadline so a stuck task cannot pin the process.
          const deadline = setTimeout(() => hooks.exit?.(0), DISPOSE_EXIT_DEADLINE_MS);
          socket.once('finish', () => {
            clearTimeout(deadline);
            hooks.exit?.(0);
          });
        }
        sendResponse(socket, response);
      } finally {
        hooks.onBusy?.(false);
      }
    })();
  });
}
