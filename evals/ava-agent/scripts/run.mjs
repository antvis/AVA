import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { takeOptions } from '../../_shared/args.js';
import { hashTree } from '../lib/files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = resolve(root, '../..');

// The adapter prepares host-side evaluation inputs; this runner owns Eve and the sandbox lifecycle.
export async function run(command, input, prepareEvaluation) {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    throw new Error('ava-agent requires Node.js 24+.');
  }

  // Package-local env has priority over the existing evals env; never print secrets.
  for (const path of [join(root, '.env'), resolve(root, '../.env')]) {
    if (existsSync(path)) process.loadEnvFile(path);
  }

  if (!['dev', 'eval'].includes(command)) throw new Error('Use npm run dev or npm run eval.');
  if (command === 'eval' && !prepareEvaluation) throw new Error('Run evaluations through npm run eval or evals/cli.js.');

  const {
    values: { skill },
    rest: args,
  } = takeOptions(input, { skill: { type: 'string', default: 'ava' } });

  if (!['ava', 'none'].includes(skill)) throw new Error('--skill must be ava or none.');

  // Remote servers would not use this snapshot's skill/image/model. Do not mislabel them.
  if (args.some((arg) => arg === '--url' || arg.startsWith('--url='))) {
    throw new Error('This runner tests the local snapshot, not --url targets.');
  }

  const listing = args.includes('--list') || args.includes('--help');
  const imageFile = join(root, '.runtime/image.json');
  const image = existsSync(imageFile) ? JSON.parse(readFileSync(imageFile, 'utf8')) : null;

  if (!listing) {
    if (['OPENAI_MODEL', 'OPENAI_API_KEY', 'OPENAI_BASE_URL'].some((name) => !process.env[name]?.trim())) {
      throw new Error('OPENAI_MODEL, OPENAI_API_KEY, and OPENAI_BASE_URL are all required.');
    }

    if (!image) throw new Error('Run npm run sandbox:build first.');

    if (
      image.avaBuildHash !== hashTree(join(repo, 'lib')) ||
      image.avaSourceHash !== hashTree(join(repo, 'src')) ||
      image.sandboxHash !== hashTree(join(root, 'sandbox'))
    ) {
      throw new Error('AVA or the sandbox recipe changed. Run npm run sandbox:build again.');
    }

    execFileSync('docker', ['image', 'inspect', image.imageId], { stdio: 'ignore' });
  }

  const contextWindow = Number(process.env.MODEL_CONTEXT_WINDOW ?? 128000);
  if (!Number.isSafeInteger(contextWindow) || contextWindow < 8192) {
    throw new Error('MODEL_CONTEXT_WINDOW must be an integer >= 8192.');
  }

  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${skill}-${randomUUID().slice(0, 8)}`;
  const directory = join(root, '.runs', id);
  mkdirSync(directory, { recursive: true });

  for (const entry of ['agent', 'lib', 'evals', 'package.json', 'tsconfig.json']) {
    cpSync(join(root, entry), join(directory, entry), { recursive: true });
  }

  const evaluation = prepareEvaluation ? await prepareEvaluation(directory) : {};

  // Lock files stay local; archive one when available, but never require it to run.
  const lockFile = join(root, 'package-lock.json');
  if (existsSync(lockFile)) cpSync(lockFile, join(directory, 'package-lock.json'));

  symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir');

  const skillSource = join(repo, 'skills/ava');
  if (skill === 'ava') {
    cpSync(skillSource, join(directory, 'agent/skills/ava'), { recursive: true });

    appendFileSync(
      join(directory, 'agent/instructions.md'),
      '\n## Required Skill\n\n' +
        'At the start of every turn, before any other tool, call load_skill with {"skill":"ava"}. ' +
        'Wait for it to succeed, then follow the AVA Skill and use the actual AVA CLI for supported analysis tasks. ' +
        'Do not skip the Skill or substitute a Python/pandas-only solution. ' +
        'If loading fails, report the failure instead of proceeding without the Skill.\n'
    );
  } else {
    rmSync(join(directory, 'agent/tools/load_skill.ts'));
  }

  const manifest = {
    id,
    ...evaluation.manifest,
    skill,
    skillHash: skill === 'ava' ? hashTree(skillSource) : null,
    agentHash: hashTree(join(directory, 'agent')),
    harnessHash: hashTree(join(directory, 'lib')),
    evalHash: hashTree(join(directory, 'evals')),
    image,
    model: process.env.OPENAI_MODEL ?? null,
    baseURL: process.env.OPENAI_BASE_URL ?? null,
    modelContextWindow: contextWindow,
    node: process.versions.node,
    eve: '0.67.2',
    arguments: args,
    createdAt: new Date().toISOString(),
  };

  writeFileSync(join(directory, 'run.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.error(`ava-agent ${skill}: ${directory}`);

  const child = spawn(process.execPath, [join(root, 'node_modules/eve/bin/eve.js'), command, ...args], {
    cwd: directory,
    stdio: 'inherit',
    env: {
      ...process.env,
      EVE_TELEMETRY_DISABLED: '1',
      AVA_AGENT_IMAGE: image?.imageId ?? '',
      AVA_AGENT_RUN_DIR: directory,
      AVA_AGENT_SKILL: skill,
      AVA_AGENT_BENCHMARK: evaluation.manifest?.benchmark ?? '',
      AVA_AGENT_EVAL_DIR: evaluation.directory ?? '',
    },
  });

  const interrupt = () => child.kill('SIGINT');
  const terminate = () => child.kill('SIGTERM');

  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);

  try {
    const { code, signal } = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => resolve({ code, signal }));
    });
    writeFileSync(
      join(directory, 'exit.json'),
      JSON.stringify({ code, signal, endedAt: new Date().toISOString() }) + '\n'
    );
    process.exitCode = code ?? 1;
    return { directory, code, signal };
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...input] = process.argv.slice(2);
  run(command, input).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
