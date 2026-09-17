/**
 * SSH tunnel helper for database loaders: forward a local port to the target
 * database server through SSH, so DuckDB can ATTACH to 127.0.0.1:localPort.
 */

import { createServer, type Server, type Socket } from 'node:net';

import { Client } from 'ssh2';

import type { SSHOptions } from '../../../types';

const SSH_CONNECT_TIMEOUT_MS = 10000;

export interface SSHTunnel {
  localPort: number;
  close: () => Promise<void>;
}

function connectSshClient(ssh: SSHOptions): Promise<Client> {
  const client = new Client();
  return new Promise((resolve, reject) => {
    client
      .once('ready', () => resolve(client))
      .once('error', reject)
      .connect({
        host: ssh.host,
        port: ssh.port ?? 22,
        username: ssh.user,
        password: ssh.password,
        readyTimeout: SSH_CONNECT_TIMEOUT_MS,
      });
  });
}

/** Forward a local port to the target host:port through SSH */
export async function createSshTunnel(
  ssh: SSHOptions,
  targetHost: string,
  targetPort: number
): Promise<SSHTunnel> {
  const client = await connectSshClient(ssh);
  const sockets = new Set<Socket>();
  const server: Server = createServer((socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
    client.forwardOut(
      socket.localAddress ?? '127.0.0.1',
      socket.localPort ?? 0,
      targetHost,
      targetPort,
      (error, stream) => {
        if (error) {
          socket.destroy(error);
          return;
        }
        socket.pipe(stream);
        stream.pipe(socket);
      }
    );
  });

  const localPort = await new Promise<number>((resolve, reject) => {
    server.once('error', reject).listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        resolve(address.port);
      } else {
        reject(new Error('Failed to assign a local port for the SSH tunnel'));
      }
    });
  });

  return {
    localPort,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      if (server.listening) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
      client.end();
    },
  };
}
