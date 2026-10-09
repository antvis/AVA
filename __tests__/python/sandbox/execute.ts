import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

import type { ExecutionResult } from '../../../src/types';

export const docker = promisify(execFile);
export const image = process.env.AVA_PYTHON_DOCKER_IMAGE || 'ava-python-test:local';

/** Every invocation owns one container, including cleanup after a killed Docker client. */
export async function executeDocker(
  code: string,
  { timeout = 15000, name = `ava-python-test-${randomUUID()}` } = {}
): Promise<ExecutionResult> {
  try {
    return await new Promise((resolve, reject) => {
      const child = execFile(
        'docker',
        [
          'run',
          '--rm',
          '-i',
          '--name',
          name,
          '--network=none',
          '--read-only',
          '--user=65534:65534',
          '--cap-drop=ALL',
          '--security-opt=no-new-privileges',
          '--cpus=1',
          '--memory=256m',
          '--memory-swap=256m',
          '--pids-limit=64',
          '--tmpfs=/tmp:rw,noexec,nosuid,size=16m',
          '-e',
          'OPENBLAS_NUM_THREADS=1',
          '-e',
          'PYTHONDONTWRITEBYTECODE=1',
          image,
          'python3',
          '-',
        ],
        { timeout, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(error.killed ? 'Docker execution timed out' : stderr.trim() || error.message));
            return;
          }
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error('Docker returned invalid JSON'));
          }
        }
      );
      child.stdin!.on('error', reject);
      child.stdin!.end(code);
    });
  } finally {
    // Do not mask a cleanup failure: a leaked container must fail the test.
    await docker('docker', ['rm', '-f', name]).catch((error) => {
      if (!String(error.stderr).includes('No such container')) throw error;
    });
  }
}
