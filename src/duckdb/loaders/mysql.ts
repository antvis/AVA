/**
 * MySQL loader: ATTACH a MySQL database through DuckDB's mysql extension
 * and register one table as the data view. Supports an optional SSH tunnel.
 * https://duckdb.org/docs/lts/core_extensions/mysql
 */

import { createServer, type Server, type Socket } from 'node:net';

import { Client } from 'ssh2';

import { escapeSql } from '../../util/sql';

import type { MySQLSourceOptions, MySQLSSHOptions, LoadedSource } from '../../types';

const ATTACH_ALIAS = 'mysql_source';
const SSH_CONNECT_TIMEOUT_MS = 10000;

interface SSHTunnel {
  localPort: number;
  close: () => Promise<void>;
}

/** Build the space-separated `key=value` connection string DuckDB's mysql extension expects */
function buildConnectionString(options: MySQLSourceOptions): string {
  const parts: Array<[string, string]> = [
    ['host', options.host],
    ['port', String(options.port ?? 3306)],
    ['database', options.database],
  ];
  if (options.user) parts.push(['user', options.user]);
  if (options.password) parts.push(['password', options.password]);
  return parts.map(([key, value]) => `${key}=${value}`).join(' ');
}

/** Quote a SQL identifier (database/table name) */
function identifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function connectSshClient(ssh: MySQLSSHOptions): Promise<Client> {
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

/**
 * Forward a local port to the target MySQL server through SSH,
 * so DuckDB can ATTACH to 127.0.0.1:localPort.
 */
async function createSshTunnel(ssh: MySQLSSHOptions, targetHost: string, targetPort: number): Promise<SSHTunnel> {
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

export async function loadMySQL(options: MySQLSourceOptions): Promise<LoadedSource> {
  // Open the SSH tunnel first; ATTACH then targets the local forwarded port
  const tunnel = options.ssh
    ? await createSshTunnel(options.ssh, options.host, options.port ?? 3306)
    : undefined;
  const attachOptions = tunnel
    ? { ...options, host: '127.0.0.1', port: tunnel.localPort, ssh: undefined }
    : options;

  return {
    register: async (conn, tableName) => {
      try {
        await conn.run('LOAD mysql');
        // READ_ONLY keeps the analysis read-only against the source database
        await conn.run(
          `ATTACH '${escapeSql(buildConnectionString(attachOptions))}' AS ${ATTACH_ALIAS} (TYPE mysql, READ_ONLY)`
        );
        await conn.run(
          `CREATE OR REPLACE VIEW ${tableName} AS SELECT * FROM ${identifier(ATTACH_ALIAS)}.${identifier(
            options.database
          )}.${identifier(options.table)}`
        );
      } catch (error) {
        await tunnel?.close();
        throw error;
      }
    },
    // Pure remote source — no local file access needed after ATTACH
    allowedDirectories: [],
    cleanup: async () => {
      await tunnel?.close();
    },
  };
}
