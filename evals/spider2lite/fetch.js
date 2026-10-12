#!/usr/bin/env node

const { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFile } = require('node:child_process');
const { promisify, parseArgs } = require('node:util');
const { createHash } = require('node:crypto');
const { writeFileSync } = require('node:fs');

const REPO = 'https://github.com/xlang-ai/Spider2.git';
const exec = promisify(execFile);
const HELP =
  'Usage: node evals/spider2lite/fetch.js [--revision <commit>]\nDownloads GitHub resources and the official evaluator. Download and extract SQLite databases manually; see evals/spider2lite/README.md.\n';

function readJsonl(path) {
  const rows = readFileSync(path, 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
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
  const { values } = parseArgs({ args, options: { help: { type: 'boolean' }, revision: { type: 'string' } } });
  if (values.help) return process.stdout.write(HELP);
  if (values.revision && !/^[a-f0-9]{40}$/i.test(values.revision))
    throw new Error('--revision must be a full Git commit SHA.');

  const temporary = mkdtempSync(join(tmpdir(), 'spider2lite-'));
  const repository = join(temporary, 'repo');
  try {
    process.stdout.write('Fetching Spider 2.0-Lite questions, resource and gold from GitHub...\n');
    await exec('git', [
      'clone',
      '--depth',
      '1',
      '--filter=blob:none',
      '--no-checkout',
      '--branch',
      'main',
      REPO,
      repository,
    ]);
    await exec('git', [
      '-C',
      repository,
      'sparse-checkout',
      'set',
      '--no-cone',
      '/spider2-lite/spider2-lite.jsonl',
      '/spider2-lite/resource/',
      '/spider2-lite/evaluation_suite/',
    ]);
    if (values.revision) {
      await exec('git', ['-C', repository, 'fetch', '--depth', '1', 'origin', values.revision]);
      await exec('git', ['-C', repository, 'checkout', '--detach', 'FETCH_HEAD']);
    } else {
      await exec('git', ['-C', repository, 'checkout']);
    }
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
      throw new Error(
        `Missing ${evaluationFile} in upstream gold at ${revision.trim()}. Found: ${goldFiles.join(', ')}`
      );
    }
    const questions = readJsonl(questionsPath);
    const evaluations = readJsonl(join(gold, evaluationFile));
    const evaluationIds = new Set(evaluations.map((row) => row.instance_id));
    if (
      questions.length !== evaluations.length ||
      questions.some((row) => !row.db || !row.question || !evaluationIds.has(row.instance_id))
    ) {
      throw new Error('Questions and gold metadata are incomplete or do not match.');
    }
    const results = readdirSync(join(gold, 'exec_result')).filter((name) => name.endsWith('.csv'));
    if (!results.length) throw new Error('No gold execution results found.');

    const evaluator = join(source, 'evaluation_suite', 'evaluate.py');
    if (!readFileSync(evaluator, 'utf8').includes('def compare_pandas_table(')) {
      throw new Error('Unsupported upstream evaluator: compare_pandas_table missing.');
    }
    const files = {};
    function fingerprint(directory, prefix = '') {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const name = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) fingerprint(join(directory, entry.name), name);
        else if (entry.isFile())
          files[name] = createHash('sha256')
            .update(readFileSync(join(directory, entry.name)))
            .digest('hex');
      }
    }
    fingerprint(source);

    // Publish only after downloads and validation succeed. Keep unrelated local files intact.
    cpSync(resource, join(__dirname, 'resource'), { recursive: true });
    mkdirSync(join(__dirname, 'evaluation_suite'), { recursive: true });
    cpSync(join(source, 'evaluation_suite'), join(__dirname, 'evaluation_suite'), { recursive: true });
    copyFileSync(questionsPath, join(__dirname, 'spider2-lite.jsonl'));
    writeFileSync(
      join(__dirname, 'upstream.json'),
      JSON.stringify(
        { repository: REPO, revision: revision.trim(), fetchedAt: new Date().toISOString(), files },
        null,
        2
      ) + '\n'
    );
    process.stdout.write(
      `Fetched ${questions.length} questions and ${
        results.length
      } gold CSV files, plus the complete resource directory.\nUpstream revision: ${revision.trim()}\n`
    );
    process.stdout.write(
      'SQLite databases must be downloaded and extracted manually to resource/databases/spider2-localdb/; see evals/spider2lite/README.md.\n'
    );
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
