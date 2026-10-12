#!/usr/bin/env node

const assert = require('node:assert/strict');
const { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const URL = 'https://bird-bench.oss-cn-beijing.aliyuncs.com/dev.zip';
const OUTPUT = join(__dirname, 'datasets', 'dev');
const exec = promisify(execFile);

async function main() {
  const temporary = mkdtempSync(join(tmpdir(), 'bird-bench-'));
  try {
    const archive = join(temporary, 'dev.zip');
    process.stdout.write('Downloading BIRD dev (~330 MiB)...\n');
    await exec('curl', [
      '-fL',
      '-sS',
      '--retry',
      '3',
      '--retry-all-errors',
      '--connect-timeout',
      '20',
      '-o',
      archive,
      URL,
    ]);
    await exec('unzip', ['-tq', archive]);
    await exec('unzip', ['-q', archive, '-d', temporary]);

    const source = join(temporary, 'dev_20240627');
    const databases = join(source, 'dev_databases.zip');
    process.stdout.write('Extracting and checking BIRD dev databases...\n');
    await exec('unzip', ['-tq', databases]);
    await exec('unzip', ['-q', databases, '-d', source, '-x', '__MACOSX/*']);

    const questions = JSON.parse(readFileSync(join(source, 'dev.json'), 'utf8'));
    const tables = JSON.parse(readFileSync(join(source, 'dev_tables.json'), 'utf8'));
    assert.equal(questions.length, 1534, 'Expected 1534 BIRD dev questions.');
    const dbIds = new Set(questions.map((question) => question.db_id));
    assert.equal(dbIds.size, 11, 'Expected 11 BIRD dev databases.');
    for (const dbId of dbIds) {
      assert.match(dbId, /^[a-zA-Z0-9_]+$/);
      assert(
        tables.some((table) => table.db_id === dbId),
        `Missing schema for ${dbId}.`
      );
      assert(statSync(join(source, 'dev_databases', dbId, `${dbId}.sqlite`)).size > 0, `Empty database: ${dbId}.`);
    }

    rmSync(databases);
    mkdirSync(OUTPUT, { recursive: true });
    cpSync(source, OUTPUT, { recursive: true });
    process.stdout.write(`Fetched ${questions.length} questions and ${dbIds.size} databases to ${OUTPUT}\n`);
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
