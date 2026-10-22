#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT, selectSamples, inspectResources } from './index.js';
import { atomicJson, sha256 } from '../_shared/files.js';

const VERSION = 'dev_20251106';
const QUESTIONS_URL = 'https://huggingface.co/datasets/birdsql/bird_sql_dev_20251106/resolve/main/data/dev_20251106-00000-of-00001.json';
const QUESTIONS_SHA256 = 'ffd8018378ddb1a8794753e0a31cfc81862ff7318a5184c22f3dc4ce03a03feb';
// New Dev reuses the original databases; never import the archive's old annotations.
const DATABASES_URL = 'https://bird-bench.oss-cn-beijing.aliyuncs.com/dev.zip';
const exec = promisify(execFile);

async function download(url, path) {
  await exec('curl', ['-fL', '-sS', '--retry', '3', '--retry-all-errors', '--connect-timeout', '20', '-o', path, url]);
}

async function main() {
  const temporary = mkdtempSync(join(tmpdir(), 'bird-bench-'));
  try {
    process.stdout.write(`Downloading BIRD New Dev (${VERSION})...\n`);
    const questionsPath = join(temporary, 'dev.json');
    await download(QUESTIONS_URL, questionsPath);
    assert.equal(sha256(questionsPath), QUESTIONS_SHA256, 'New Dev checksum changed; verify the upstream release before updating.');
    const questions = selectSamples({ limit: 'all' }, temporary);
    assert.equal(questions.length, 1534, 'Expected 1534 BIRD New Dev questions.');
    const dbIds = new Set(questions.map((question) => question.db_id));
    assert.equal(dbIds.size, 11, 'Expected 11 BIRD databases.');

    if (!existsSync(join(ROOT, 'dev_databases'))) {
      const archive = join(temporary, 'dev.zip');
      process.stdout.write('Downloading shared BIRD databases (~330 MiB)...\n');
      await download(DATABASES_URL, archive);
      await exec('unzip', ['-tq', archive]);
      await exec('unzip', ['-jq', archive, '*/dev_databases.zip', '-d', temporary]);
      const databases = join(temporary, 'dev_databases.zip');
      await exec('unzip', ['-tq', databases]);
      await exec('unzip', ['-q', databases, '-d', temporary, '-x', '__MACOSX/*']);
      inspectResources(questions, temporary);
      mkdirSync(ROOT, { recursive: true });
      cpSync(join(temporary, 'dev_databases'), join(ROOT, 'dev_databases'), { recursive: true });
    }
    inspectResources(questions, ROOT);
    for (const db of dbIds) {
      assert(readdirSync(join(ROOT, 'dev_databases', db, 'database_description')).some((name) => name.endsWith('.csv')),
        `Missing database descriptions: ${db}`);
    }

    atomicJson(join(ROOT, 'dev.json'), questions);
    atomicJson(join(ROOT, 'dataset.json'), { version: VERSION, source: QUESTIONS_URL, sourceSha256: QUESTIONS_SHA256, questions: questions.length, databases: dbIds.size });
    for (const name of ['dev.sql', 'dev_tied_append.json', 'dev_tables.json']) rmSync(join(ROOT, name), { force: true });
    process.stdout.write(`Installed ${VERSION}: ${questions.length} questions, ${dbIds.size} databases at ${ROOT}\n`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export { main };
