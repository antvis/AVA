#!/usr/bin/env node

const { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const REPO = 'https://github.com/xlang-ai/Spider2.git';
const exec = promisify(execFile);
const HELP = 'Usage: node evals/spider2lite/fetch.js\nDownloads GitHub resources only. Download and extract SQLite databases manually; see evals/spider2lite/README.md.\n';

function readJsonl(path) {
  const rows = readFileSync(path, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const ids = new Set();
  for (const row of rows) {
    if (!row.instance_id || ids.has(row.instance_id)) {
      throw new Error(`${path}: missing or duplicate instance_id.`);
    }
    ids.add(row.instance_id);
  }
  return rows;
}

async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') return process.stdout.write(HELP);
  if (args.length) throw new Error(HELP);

  const temporary = mkdtempSync(join(tmpdir(), 'spider2lite-'));
  const repository = join(temporary, 'repo');
  try {
    process.stdout.write('Fetching Spider 2.0-Lite questions, resource and gold from GitHub...\n');
    await exec('git', ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout', '--branch', 'main', REPO, repository]);
    await exec('git', ['-C', repository, 'sparse-checkout', 'set', '--no-cone',
      '/spider2-lite/spider2-lite.jsonl',
      '/spider2-lite/resource/',
      '/spider2-lite/evaluation_suite/gold/',
    ]);
    await exec('git', ['-C', repository, 'checkout']);
    const { stdout: revision } = await exec('git', ['-C', repository, 'rev-parse', 'HEAD']);
    const source = join(repository, 'spider2-lite');
    const resource = join(source, 'resource');
    if (!readdirSync(resource).length) throw new Error('Upstream resource directory is empty.');
    const questionsPath = join(source, 'spider2-lite.jsonl');
    const gold = join(source, 'evaluation_suite', 'gold');
    // Upstream uses spider2-lite.jsonl for questions, but spider2lite_eval.jsonl for gold.
    const evaluationFile = 'spider2lite_eval.jsonl';
    const goldFiles = readdirSync(gold);
    if (!goldFiles.includes(evaluationFile)) {
      throw new Error(`Missing ${evaluationFile} in upstream gold at ${revision.trim()}. Found: ${goldFiles.join(', ')}`);
    }
    const questions = readJsonl(questionsPath);
    const evaluations = readJsonl(join(gold, evaluationFile));
    const evaluationIds = new Set(evaluations.map((row) => row.instance_id));
    if (questions.length !== evaluations.length || questions.some((row) => !row.db || !row.question || !evaluationIds.has(row.instance_id))) {
      throw new Error('Questions and gold metadata are incomplete or do not match.');
    }
    const results = readdirSync(join(gold, 'exec_result')).filter((name) => name.endsWith('.csv'));
    if (!results.length) throw new Error('No gold execution results found.');

    // Publish only after downloads and validation succeed. Keep unrelated local files intact.
    cpSync(resource, join(__dirname, 'resource'), { recursive: true });
    mkdirSync(join(__dirname, 'evaluation_suite'), { recursive: true });
    cpSync(gold, join(__dirname, 'evaluation_suite', 'gold'), { recursive: true });
    copyFileSync(questionsPath, join(__dirname, 'spider2-lite.jsonl'));
    process.stdout.write(`Fetched ${questions.length} questions and ${results.length} gold CSV files, plus the complete resource directory.\nUpstream revision: ${revision.trim()}\n`);
    process.stdout.write('SQLite databases must be downloaded and extracted manually to resource/databases/spider2-localdb/; see evals/spider2lite/README.md.\n');
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
