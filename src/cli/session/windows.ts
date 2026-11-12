import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { connect, createServer } from 'tls';
import { promisify } from 'util';

import { IPC_TIMEOUT_MS } from './protocol';

import type { Socket } from 'net';

const run = promisify(execFile);
const keyBytes = 32;
const identity = 'ava-session';
const tls = {
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.2',
  ciphers: 'PSK-AES256-GCM-SHA384',
} as const;

export async function createPipeKey(directory: string): Promise<void> {
  const system = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32');
  const options = { windowsHide: true, timeout: 10_000 };
  const { stdout } = await run(join(system, 'whoami.exe'), ['/user', '/fo', 'csv', '/nh'], options);
  const sid = /"(S-1-(?:\d+-)*\d+)"\s*$/.exec(stdout)?.[1];
  if (!sid) throw new Error('Cannot identify the Windows user for the dataset session.');

  // Windows ignores POSIX mkdir modes. Restrict the new directory before writing the key.
  await run(join(system, 'icacls.exe'), [directory, '/grant:r', '*' + sid + ':(OI)(CI)F', '/inheritancelevel:r'], options);
  await writeFile(join(directory, 'key'), randomBytes(keyBytes), { flag: 'wx' });
}

async function readPipeKey(directory: string): Promise<Buffer> {
  const key = await readFile(join(directory, 'key'));
  if (key.length !== keyBytes) throw new Error('Invalid Windows dataset session key.');
  return key;
}

// Node's pipe permissions do not enforce same-user access. TLS-PSK
// authenticates both ends using a key kept outside the public dataset ID.
export async function createPipeServer(directory: string, onConnection: (socket: Socket) => void) {
  const key = await readPipeKey(directory);
  return createServer(
    {
      ...tls,
      handshakeTimeout: IPC_TIMEOUT_MS,
      pskCallback: (_, name) => (name === identity ? key : null),
    },
    onConnection
  );
}

export async function connectPipe(path: string, directory: string) {
  const key = await readPipeKey(directory);
  return connect({
    ...tls,
    path,
    // The only enabled cipher authenticates the server with the shared key.
    rejectUnauthorized: false,
    pskCallback: () => ({ psk: key, identity }),
  });
}
