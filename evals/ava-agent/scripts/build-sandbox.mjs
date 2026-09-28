import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { hashTree } from '../lib/files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = resolve(root, '../..');

if (Number(process.versions.node.split('.')[0]) < 24) {
  throw new Error('ava-agent requires Node.js 24+.');
}

const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
run('docker', ['info', '--format', '{{.ServerVersion}}']);

// Always build current source; do not accidentally test stale lib/ output.
run('npm', ['run', 'build'], repo);

const context = mkdtempSync(join(tmpdir(), 'ava-agent-image-'));

try {
  const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));

  // Pin direct runtime dependencies to the versions already resolved by this checkout.
  const dependencies = Object.fromEntries(
    Object.keys(pkg.dependencies).map((name) => [
      name,
      JSON.parse(readFileSync(join(repo, 'node_modules', name, 'package.json'), 'utf8')).version,
    ])
  );

  writeFileSync(
    join(context, 'package.json'),
    JSON.stringify({ name: pkg.name, version: pkg.version, private: true, dependencies }, null, 2)
  );

  for (const dir of ['lib', 'esm']) {
    cpSync(join(repo, dir), join(context, dir), { recursive: true });
  }

  cpSync(join(root, 'sandbox/Dockerfile'), join(context, 'Dockerfile'));

  const sourceHash = hashTree(context);
  const image = `ava-agent:${sourceHash.slice(0, 16)}`;
  run('docker', ['build', '-t', image, context]);

  const imageId = execFileSync('docker', ['image', 'inspect', image, '--format', '{{.Id}}'], {
    encoding: 'utf8',
  }).trim();

  const info = {
    image,
    imageId,
    sourceHash,
    sandboxHash: hashTree(join(root, 'sandbox')),
    avaBuildHash: hashTree(join(repo, 'lib')),
    avaSourceHash: hashTree(join(repo, 'src')),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    builtAt: new Date().toISOString(),
    dependencies,
  };

  mkdirSync(join(root, '.runtime'), { recursive: true });
  writeFileSync(join(root, '.runtime/image.json'), JSON.stringify(info, null, 2) + '\n');

  console.log(`Sandbox ready: ${image} (${imageId})`);
} finally {
  rmSync(context, { recursive: true, force: true });
}
