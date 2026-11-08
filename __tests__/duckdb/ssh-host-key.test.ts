import { createHash } from 'node:crypto';
import { once } from 'node:events';

import { Server, utils } from 'ssh2';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSshTunnel } from '../../src/duckdb/util/ssh';

import type { Connection } from 'ssh2';
import type { SSHOptions } from '../../src/types';
import type { SSHTunnel } from '../../src/duckdb/util/ssh';

const hostKey = utils.generateKeyPairSync('ed25519');
const fingerprint = `SHA256:${createHash('sha256')
  .update(Buffer.from(hostKey.public.split(' ')[1], 'base64'))
  .digest('base64')
  .replace(/=+$/, '')}`;

describe('SSH host key verification', () => {
  let server: Server;
  let port: number;
  let tunnel: SSHTunnel | undefined;
  let passwords: string[];
  let connections: Set<Connection>;

  beforeEach(async () => {
    passwords = [];
    connections = new Set();
    server = new Server({ hostKeys: [hostKey.private] }, (connection) => {
      connections.add(connection);
      connection.on('close', () => connections.delete(connection));
      // Rejected host keys close the handshake; the server must handle that error.
      connection.on('error', () => {});
      connection.on('authentication', (context) => {
        if (context.method === 'password') {
          passwords.push(context.password);
          context.accept();
        } else {
          context.reject(['password']);
        }
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    port = (server.address() as { port: number }).port;
  });

  afterEach(async () => {
    await tunnel?.close();
    tunnel = undefined;
    for (const connection of connections) connection.end();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function connect(hostFingerprint?: string) {
    tunnel = await createSshTunnel(
      { host: '127.0.0.1', port, user: 'reader', password: 'DUMMY-SSH-PASSWORD', hostFingerprint } as SSHOptions,
      'database',
      3306
    );
    return tunnel;
  }

  it('authenticates when the server key matches the trusted SHA-256 fingerprint', async () => {
    tunnel = await connect(fingerprint);
    expect(passwords).toEqual(['DUMMY-SSH-PASSWORD']);
    expect(tunnel.localPort).toBeGreaterThan(0);
  });

  it('rejects a changed server key before sending a password', async () => {
    await expect(connect(`SHA256:${Buffer.alloc(32).toString('base64').replace(/=+$/, '')}`)).rejects.toThrow(
      /verification failed/i
    );
    expect(passwords).toEqual([]);
  });

  it('rejects a missing host fingerprint before authentication', async () => {
    await expect(connect()).rejects.toThrow(/hostFingerprint/);
    expect(passwords).toEqual([]);
  });
});
