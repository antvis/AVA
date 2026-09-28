import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DockerSandbox } from 'eve/sandbox/docker';
import { runScript } from '../lib/execute.mjs';

const { imageId } = JSON.parse(readFileSync(new URL('../.runtime/image.json', import.meta.url)));
const sandbox = await DockerSandbox.image(imageId, { pullPolicy: 'never' }).open({ networkPolicy: 'deny-all' });
try {
  const cli = await runScript(sandbox, 'ava --help', 'bash');
  assert.equal(cli.exitCode, 0);
  assert.match(cli.stdout, /ava <command>/);
  const write = await runScript(sandbox, "printf 'shared' | tr a-z A-Z > /workspace/shared.txt", 'bash');
  assert.equal(write.exitCode, 0);
  const read = await runScript(sandbox, "from pathlib import Path\nprint(Path('/workspace/shared.txt').read_text())", 'python');
  assert.equal(read.stdout.trim(), 'SHARED');
  const failed = await runScript(sandbox, 'echo problem >&2\nfalse | cat\necho unreachable', 'bash');
  assert.notEqual(failed.exitCode, 0);
  assert.equal(failed.stdout, '');
  assert.match(failed.stderr, /problem/);
  const large = await runScript(sandbox, 'printf 123456789', 'bash', { maxBytes: 4 });
  assert.equal(large.stdout, '1234');
  assert.equal(large.truncated, true);
  const timeout = await runScript(sandbox, 'sleep 10', 'bash', { timeoutMs: 500 });
  assert.equal(timeout.timedOut, true);
  const cleaned = await runScript(sandbox, "find /workspace -maxdepth 1 -name '.python-*' -print", 'bash');
  assert.equal(cleaned.stdout, '');
  console.log('Bash CLI, shared files, Python, pipefail, output limits, and timeout checks passed');
} finally {
  await sandbox.delete();
}
