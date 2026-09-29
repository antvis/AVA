import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const exec = promisify(execFile);

// Only disposable Eve session containers belonging to this exact eval session.
export async function removeSessionContainers(sessionId) {
  if (!sessionId) throw new Error('A session ID is required for sandbox cleanup.');
  const { stdout } = await exec('docker', ['ps', '-aq',
    '--filter', 'label=eve.sandbox=1',
    '--filter', 'label=eve.sandbox.role=session',
    '--filter', `label=eve.sandbox.tag.sessionId=${sessionId}`], { timeout: 30000 });
  const ids = stdout.trim().split(/\s+/).filter(Boolean);
  if (ids.length) await exec('docker', ['rm', '-f', ...ids], { timeout: 30000 });
}

// Also reclaim sessions left behind when the eval subprocess crashes or is interrupted.
export async function removeRunContainers(directory) {
  const files = await readdir(join(directory, '.eve/.workflow-data/runs')).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const sessions = new Set(files.filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5)));
  if (!sessions.size) return;
  const { stdout } = await exec('docker', ['ps', '-a',
    '--filter', 'label=eve.sandbox=1', '--filter', 'label=eve.sandbox.role=session',
    '--format', '{{.ID}}\t{{.Label "eve.sandbox.tag.sessionId"}}'], { timeout: 30000 });
  const ids = stdout.trim().split('\n').map((line) => line.split('\t'))
    .filter(([, sessionId]) => sessions.has(sessionId)).map(([id]) => id);
  for (let i = 0; i < ids.length; i += 50) {
    await exec('docker', ['rm', '-f', ...ids.slice(i, i + 50)], { timeout: 30000 });
  }
}
