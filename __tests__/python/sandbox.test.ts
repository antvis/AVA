import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { docker, executeDocker } from './sandbox/execute';

async function expectRemoved(name: string) {
  const { stdout } = await docker('docker', ['ps', '-aq', '--filter', `name=^/${name}$`]);
  expect(stdout.trim()).toBe('');
}

describe.skipIf(process.env.AVA_PYTHON_DOCKER_TEST !== '1')('python Docker sandbox', () => {
  it('runs as non-root with a read-only root filesystem and no external network', async () => {
    const name = `ava-python-test-${randomUUID()}`;
    const result = await executeDocker(
      `
import os, errno, socket, json
assert os.getuid() != 0
# /var/tmp is normally world-writable, so failure must be EROFS, not permissions.
try:
    open('/var/tmp/ava-write-test', 'w').close()
    raise AssertionError('root filesystem is writable')
except OSError as error:
    assert error.errno == errno.EROFS, error
assert socket.if_nameindex() == [(1, 'lo')]
try:
    socket.create_connection(('1.1.1.1', 443), timeout=1).close()
    raise AssertionError('external network is reachable')
except OSError:
    pass
print(json.dumps({'data': [{'isolated': True}], 'schema': []}))
`,
      { name }
    );
    expect(result.data).toEqual([{ isolated: true }]);
    await expectRemoved(name);
  }, 20000);

  it('applies CPU, memory and PID limits and terminates and removes timed-out containers', async () => {
    const name = `ava-python-test-${randomUUID()}`;
    // Attach the rejection handler immediately while inspecting the live container.
    const pending = executeDocker('import time\ntime.sleep(60)', { name, timeout: 6000 }).catch((error) => error);
    try {
      let info: { State: { Running: boolean }; HostConfig: Record<string, unknown> } | undefined;
      const deadline = Date.now() + 4000;
      while (Date.now() < deadline) {
        try {
          const { stdout } = await docker('docker', ['inspect', name]);
          info = JSON.parse(stdout)[0];
          if (info?.State.Running) break;
        } catch {
          /* Container creation has not finished yet. */
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      expect(info?.State.Running).toBe(true);
      expect(info?.HostConfig).toMatchObject({
        NanoCpus: 1_000_000_000,
        Memory: 268435456,
        MemorySwap: 268435456,
        PidsLimit: 64,
      });
      const error = await pending;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('timed out');
      await expectRemoved(name);
    } finally {
      await pending;
    }
    const failedName = `ava-python-test-${randomUUID()}`;
    await expect(executeDocker("raise ValueError('sandbox failure')", { name: failedName })).rejects.toThrow(
      'sandbox failure'
    );
    await expectRemoved(failedName);
  }, 20000);
});
