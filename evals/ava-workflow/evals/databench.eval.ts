import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { AVA } from '../../../lib/index.js';
import { readCsv } from '../../_shared/datasets.js';
import { evaluate, getDataset, predictionIndex } from '../../_shared/index.js';
import { OUTPUT_COLUMNS, csvCell } from '../../_shared/results.js';
import { formatAnswer, selectSamples } from '../../databench/index.js';
import { workflow } from '../workflow.ts';

import type { LLMConfig } from '../../../lib/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));

const HELP = `Usage:
  node evals/cli.js run ava-workflow --benchmark databench [options]

Options:
  --dataset <name>       databench-lite or databench (default: databench-lite)
  --limit <number|all>   Questions to run (default: 20)
  --offset <number>      Start offset after filtering (default: 0)
  --suite <name>         Run one dataset, e.g. 002_Titanic
  --concurrency <number> Parallel model calls (default: 3)
  --strategy <name>      direct, loop or subset (default: direct)
  --engine <name>        duckdb or python (default: duckdb)
  --output <path>        Prediction CSV (default: evals/ava-workflow/results/<dataset>.csv)
  --help                 Show help
`;

export function llmConfig(): LLMConfig {
  const envPath = resolve(root, '.env');
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey || !model) throw new Error('Set OPENAI_API_KEY and OPENAI_MODEL in evals/ava-workflow/.env.');
  return { apiKey, model, ...(baseURL ? { baseURL } : {}) };
}

function integer(value: string, name: string, minimum: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) throw new Error(`--${name} must be an integer >= ${minimum}.`);
  return parsed;
}

export function answerFrom(data: unknown, type: string) {
  const rows = Array.isArray(data) ? data : [data];
  const values = rows.flatMap((row) =>
    row && typeof row === 'object' && !Array.isArray(row) ? Object.values(row) : [row],
  );
  if (type.startsWith('list[')) return formatAnswer(values);
  const value = values[0];
  if (value == null) return 'None';
  if (type === 'boolean' && typeof value === 'number') return value === 0 ? 'False' : 'True';
  return formatAnswer(value);
}

function prepareOutput(path: string) {
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

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      concurrency: { type: 'string', default: '3' },
      dataset: { type: 'string', default: 'databench-lite' },
      engine: { type: 'string', default: 'duckdb' },
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
  const engine = values.engine;
  if (engine !== 'duckdb' && engine !== 'python') {
    throw new Error('--engine must be duckdb or python.');
  }
  const strategy = values.strategy;
  if (strategy !== 'direct' && strategy !== 'loop' && strategy !== 'subset') {
    throw new Error('--strategy must be direct, loop or subset.');
  }
  const concurrency = integer(values.concurrency, 'concurrency', 1);
  const selected = selectSamples(values);
  const output = values.output ? resolve(values.output) : resolve(root, `results/${values.dataset}.csv`);
  const completed = prepareOutput(output);
  const pending = selected.filter((sample) => !completed.has(sample.id));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      let usage: Parameters<NonNullable<LLMConfig['onQueryUsage']>>[0] | undefined;
      const ava = new AVA({ engine: { type: engine }, llm: { ...config, onQueryUsage: (value) => (usage = value) } });
      try {
        while (cursor < pending.length) {
          const sample = pending[cursor++];
          const startedAt = Date.now();
          let sql = '';
          let answer = '';
          let error = '';
          usage = undefined;
          try {
            const result = await workflow(
              ava,
              { type: 'parquet', options: { path: sample.dataPath } },
              `${sample.question}\nReturn the ${sample.answerType} answer in one column named answer.`,
              {
                includeSummary: false,
                strategy: { type: strategy },
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
