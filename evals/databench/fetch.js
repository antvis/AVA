#!/usr/bin/env node

const { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { basename, dirname, join } = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { DuckDBInstance } = require('@duckdb/node-api');

const REPO = 'cardiffnlp/databench';
const OUTPUT = join(__dirname, 'datasets');
const VARIANTS = [
  { name: 'databench-lite', directory: 'lite', dataFile: 'sample.parquet', answerField: 'sample_answer' },
  { name: 'databench', directory: 'full', dataFile: 'all.parquet', answerField: 'answer' },
];
const exec = promisify(execFile);

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function download(path, target) {
  await exec('curl', [
    '-L',
    '-sS',
    '-f',
    '-o',
    target,
    `https://huggingface.co/datasets/${REPO}/resolve/main/${path}`,
  ]);
}

async function main() {
  const { stdout } = await exec(
    'curl',
    ['-L', '-sS', '-f', `https://huggingface.co/api/datasets/${REPO}/tree/main?recursive=true&expand=false&limit=1000`],
    { maxBuffer: 5 * 1024 * 1024 },
  );
  const paths = JSON.parse(stdout)
    .map((entry) => entry.path)
    .filter((path) => /\/(?:all|sample|qa)\.parquet$/.test(path))
    .sort();
  if (paths.length !== 240) throw new Error(`Expected 240 DataBench files, found ${paths.length}.`);

  const temporary = mkdtempSync(join(tmpdir(), 'databench-'));
  const targets = paths.map((path) => ({ path, target: join(temporary, path.replaceAll('/', '__')) }));
  let cursor = 0;
  try {
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (cursor < targets.length) {
          const item = targets[cursor++];
          await download(item.path, item.target);
        }
      }),
    );

    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    const questions = Object.fromEntries(VARIANTS.map(({ name }) => [name, []]));
    try {
      for (const qa of targets.filter((item) => item.path.endsWith('/qa.parquet'))) {
        const dataset = basename(dirname(qa.path));
        const rows = (await connection.runAndReadAll(`SELECT * FROM read_parquet(${sqlString(qa.target)})`))
          .getRowObjectsJson();
        for (const variant of VARIANTS) {
          const data = targets.find((item) => item.path === `data/${dataset}/${variant.dataFile}`);
          const directory = join(OUTPUT, variant.directory);
          mkdirSync(join(directory, 'data'), { recursive: true });
          copyFileSync(data.target, join(directory, 'data', `${dataset}.parquet`));
          rows.forEach((row, index) =>
            questions[variant.name].push({
              id: `${dataset}:${String(index + 1).padStart(2, '0')}`,
              dataset,
              question: row.question,
              answer: row[variant.answerField],
              type: row.type,
              data_path: `data/${dataset}.parquet`,
            }),
          );
        }
      }
    } finally {
      connection.closeSync();
      instance.closeSync();
    }

    const columns = [
      'id',
      'dataset',
      'question',
      'answer',
      'type',
      'data_path',
    ];
    for (const variant of VARIANTS) {
      const rows = questions[variant.name];
      if (!rows.length) throw new Error(`${variant.name} did not contain any questions.`);
      writeFileSync(
        join(OUTPUT, variant.directory, 'questions.csv'),
        `${[columns, ...rows.map((row) => columns.map((column) => row[column]))]
          .map((row) => row.map(csvCell).join(','))
          .join('\n')}\n`,
      );
      process.stdout.write(`Wrote ${rows.length} questions and 80 Parquet files to ${variant.name}\n`);
    }
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
