import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { removeSessionContainers, removeRunContainers } from '../lib/cleanup.mjs';

const { imageId } = JSON.parse(readFileSync(new URL('../.runtime/image.json', import.meta.url)));
const sessionId = `cleanup-check-${randomUUID()}`;
const create = (id) => execFileSync('docker', ['create',
  '--label', 'eve.sandbox=1', '--label', 'eve.sandbox.role=session',
  '--label', `eve.sandbox.tag.sessionId=${id}`, imageId], { encoding: 'utf8' }).trim();
const target = create(sessionId);
const unrelated = create(`${sessionId}-other`);
const directory = mkdtempSync(join(tmpdir(), 'ava-cleanup-'));
try {
  await assert.rejects(() => removeSessionContainers(''), /session ID/);
  await removeSessionContainers(sessionId);
  await removeSessionContainers(sessionId);
  const ids = execFileSync('docker', ['ps', '-aq', '--no-trunc'], { encoding: 'utf8' }).split('\n');
  assert.ok(!ids.includes(target));
  assert.ok(ids.includes(unrelated));
  const leftover = create(sessionId);
  mkdirSync(join(directory, '.eve/.workflow-data/runs'), { recursive: true });
  writeFileSync(join(directory, '.eve/.workflow-data/runs', `${sessionId}.json`), '{}');
  await removeRunContainers(directory);
  const remaining = execFileSync('docker', ['ps', '-aq', '--no-trunc'], { encoding: 'utf8' }).split('\n');
  assert.ok(!remaining.includes(leftover));
  assert.ok(remaining.includes(unrelated));
  console.log('Cleanup removes only the exact session and is safe to repeat.');
} finally {
  execFileSync('docker', ['rm', '-f', unrelated]);
  await removeSessionContainers(sessionId);
  rmSync(directory, { recursive: true, force: true });
}
