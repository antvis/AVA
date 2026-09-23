#!/usr/bin/env node

const { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const { parseArgs } = require('node:util');

const { AVA } = require('../../lib');

const { readCsv } = require('../_shared/datasets');

const { evaluate, getDataset, loadDataset, predictionIndex } = require('../_shared');

const OUTPUT_COLUMNS = [
  'id',
  'predicted_answer',
  'sql',
  'error',
  'model',
  'duration_ms',
  'input_tokens',
  'output_tokens',
  'total_tokens',
];

const HELP = `Usage:
  node cli.js databench [options]

Options:
  --dataset <name>       databench-lite or databench (default: databench-lite)
  --limit <number|all>   Questions to run (default: 20)
  --offset <number>      Start offset after filtering (default: 0)
  --suite <name>         Run one dataset, e.g. 002_Titanic
  --concurrency <number> Parallel model calls (default: 3)
  --strategy <name>      direct, loop or jev (default: direct)
  --output <path>        Prediction CSV (default: databench/results/<dataset>.csv)
  --help                 Show help
`;

function loadEnv(path = resolve('.env')) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  }
}

function llmConfig() {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey || !model) throw new Error('Set OPENAI_API_KEY and OPENAI_MODEL in .env.');
  return { apiKey, model, ...(baseURL ? { baseURL } : {}) };
}

function integer(value, name, minimum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) throw new Error(`--${name} must be an integer >= ${minimum}.`);
  return parsed;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function answerFrom(data, type) {
  const rows = Array.isArray(data) ? data : [data];
  const values = rows.flatMap((row) =>
    row && typeof row === 'object' && !Array.isArray(row) ? Object.values(row) : [row],
  );
  if (type.startsWith('list[')) return `[${values.map((value) => (value == null ? 'None' : value)).join(', ')}]`;
  const value = values[0];
  if (value == null) return 'None';
  if (type === 'boolean' && typeof value === 'number') return value === 0 ? 'False' : 'True';
  return String(value);
}

function prepareOutput(path) {
  mkdirSync(dirname(path), { recursive: true });
  const header = OUTPUT_COLUMNS.map(csvCell).join(',');
  if (!existsSync(path)) {
    writeFileSync(path, `${header}\n`);
    return new Set();
  }
  if (readFileSync(path, 'utf8').split(/\r?\n/, 1)[0] !== header) {
    throw new Error(`${path} uses an outdated DataBench prediction format; choose a new output path.`);
  }
  const rows = readCsv(path);
  return new Set(rows.filter((row) => row.predicted_answer).map((row) => row.id));
}

async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      concurrency: { type: 'string', default: '3' },
      dataset: { type: 'string', default: 'databench-lite' },
      help: { type: 'boolean' },
      limit: { type: 'string', default: '20' },
      offset: { type: 'string', default: '0' },
      output: { type: 'string' },
      strategy: { type: 'string', default: 'direct' },
      suite: { type: 'string' },
    },
  });
  if (values.help) return process.stdout.write(HELP);

  const config = llmConfig();
  if (!['databench-lite', 'databench'].includes(values.dataset)) {
    throw new Error('--dataset must be databench-lite or databench.');
  }
  if (!['direct', 'loop', 'jev'].includes(values.strategy)) throw new Error('--strategy must be direct, loop or jev.');
  const output = resolve(values.output ?? `databench/results/${values.dataset}.csv`);
  const completed = prepareOutput(output);
  const offset = integer(values.offset, 'offset', 0);
  const concurrency = integer(values.concurrency, 'concurrency', 1);
  const all = loadDataset(values.dataset).filter((sample) => !values.suite || sample.suite === values.suite);
  const limit = values.limit === 'all' ? all.length : integer(values.limit, 'limit', 1);
  const selected = all.slice(offset, offset + limit);
  const pending = selected.filter((sample) => !completed.has(sample.id));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      let usage;
      const ava = new AVA({ llm: { ...config, onQueryUsage: (value) => (usage = value) } });
      try {
        while (cursor < pending.length) {
          const sample = pending[cursor++];
          const startedAt = Date.now();
          let sql = '';
          let answer = '';
          let error = '';
          usage = undefined;
          try {
            await ava.load({ type: 'parquet', options: { path: sample.dataPath } });
            await ava.profile();
            const result = await ava.analysis(
              `${sample.question}\nReturn the ${sample.answerType} answer in one column named answer.`,
              {
                includeSummary: false,
                strategy: { type: values.strategy }
              },
            );
            sql = result.sql ?? '';
            answer = answerFrom(result.data, sample.answerType);
          } catch (cause) {
            error = cause instanceof Error ? cause.message : String(cause);
          }
          appendFileSync(
            output,
            `${[
              sample.id,
              answer,
              sql,
              error,
              config.model,
              Date.now() - startedAt,
              usage?.inputTokens ?? '',
              usage?.outputTokens ?? '',
              usage?.totalTokens ?? '',
            ].map(csvCell).join(',')}\n`,
          );
          process.stdout.write(`${answer ? 'done' : 'failed'} ${sample.id}\n`);
        }
      } finally {
        await ava.dispose();
      }
    }),
  );

  const report = await evaluate({
    samples: selected,
    predictions: predictionIndex([output]),
    metricNames: getDataset(values.dataset).defaultMetrics,
  });
  process.stdout.write(
    `Accuracy: ${(report.metrics['databench-answer'].score * 100).toFixed(2)}% ` +
    `(${report.metrics['databench-answer'].passed}/${report.total}), missing ${report.missing}\n`,
  );
  if (report.missing) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = { answerFrom, llmConfig, main };
