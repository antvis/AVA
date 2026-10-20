import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { llmConfig, modelOptions, modelSettings } from '../model.ts';
import { createUsage } from '../../_shared/usage.js';
import { integer } from '../../_shared/args.js';
import { atomicJson, readJson, sha256 } from '../../_shared/files.js';
import { implementationHashes, traceWorkflow } from '../runtime.ts';
import { prepareStrategy, strategyHelp, strategyOptions } from '../strategies.ts';

import { AVA } from '../../../lib/index.js';
import { evaluate, getDataset, predictionIndex, registerPlugin } from '../../_shared/index.js';
import { OUTPUT_COLUMNS, csvCell, readCsv } from '../../_shared/results.js';
import { formatAnswer, selectSamples, plugins } from '../../databench/index.js';
import { workflow } from '../workflow.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

const HELP = `Usage:
  node evals/cli.js run ava-workflow --benchmark databench [options]

Options:
  --dataset <name>       databench-lite or databench (default: databench-lite)
  --limit <number|all>   Questions to run (default: 20)
  --offset <number>      Start offset after filtering (default: 0)
  --suite <name>         Run one dataset, e.g. 002_Titanic
  --ids-file <path>      JSON array of exact question IDs (within the selected dataset/slice)
  --concurrency <number> Parallel model calls (default: 3)
${strategyHelp}
  --engine <name>        duckdb or python (default: duckdb)
  --output <path>        Prediction CSV (default: evals/ava-workflow/results/<dataset>.csv)
  --help                 Show help
`;

export function answerInstruction(type: string) {
  const list = /^list\[(.+)\]$/.exec(type);
  return list
    ? `Return one scalar ${list[1]} value per row in a single column named answer. Do not wrap values in SQL arrays or add numbering or display formatting.`
    : `Return a single ${type} value in one column named answer.`;
}

export function answerFrom(data: unknown, type: string) {
  const rows = Array.isArray(data) ? data : [data];
  const values = rows.map((row) => {
    const columns = row && typeof row === 'object' && !Array.isArray(row) ? Object.values(row) : [row];
    if (columns.length !== 1) throw new Error('DataBench answer must contain exactly one column.');
    const value = columns[0];
    if (value !== null && typeof value === 'object') throw new Error('DataBench answer values must be scalar.');
    return value;
  });
  if (type.startsWith('list[')) return formatAnswer(values);
  if (values.length !== 1) throw new Error('DataBench scalar answer must contain exactly one row.');
  const value = values[0];
  if (value == null || value === '') return 'None';
  if (type === 'boolean' && typeof value === 'number') return value === 0 ? 'False' : 'True';
  return formatAnswer(value);
}

export function selectByIds<T extends { id: string }>(samples: T[], ids: unknown): T[] {
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length)
    throw new Error('--ids-file must contain a nonempty JSON array of unique question IDs.');
  const requested = new Set(ids);
  const selected = samples.filter(({ id }) => requested.has(id));
  if (selected.length !== ids.length) throw new Error('--ids-file contains IDs outside the selected dataset/slice.');
  return selected;
}

export function runDirectory(output: string) {
  const id = createHash('sha256').update(resolve(output)).digest('hex').slice(0, 12);
  return resolve(root, '.runs', `${basename(output, '.csv')}-${id}`);
}

export function prepareOutput(path: string, spec: object) {
  const manifest = join(runDirectory(path), 'manifest.json');
  if (existsSync(path) && (!existsSync(manifest) || JSON.stringify(readJson(manifest)) !== JSON.stringify(spec))) {
    throw new Error("Run configuration changed or manifest missing; choose a new --output path.");
  }
  mkdirSync(dirname(path), { recursive: true });
  const header = OUTPUT_COLUMNS.map(csvCell).join(',');
  if (!existsSync(path)) {
    writeFileSync(path, `${header}\n`, { flag: 'wx' });
    atomicJson(manifest, spec);
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
      ...strategyOptions,
      ...modelOptions,
      suite: { type: 'string' },
      'ids-file': { type: 'string' },
    },
  });
  if (values.help) return process.stdout.write(HELP);

  const engine = values.engine;
  if (engine !== 'duckdb' && engine !== 'python') {
    throw new Error('--engine must be duckdb or python.');
  }
  const concurrency = integer(values.concurrency, 'concurrency', 1);
  const samples = selectSamples(values);
  const selected = values['ids-file'] ? selectByIds(samples, readJson(resolve(values['ids-file']))) : samples;
  const strategy = await prepareStrategy(values, {
    type: 'parquet', samples: selected.map(({ suite, dataPath }) => ({ suite, dataPath })),
  });
  const config = llmConfig(values);
  const output = values.output ? resolve(values.output) : resolve(root, `results/${values.dataset}.csv`);
  const run = runDirectory(output);
  const endpoint = new URL(config.baseURL);
  endpoint.username = '';
  endpoint.password = '';
  endpoint.search = '';
  const completed = prepareOutput(output, {
    dataset: values.dataset,
    model: typeof config.model === 'string' ? config.model : config.model.modelId,
    endpoint: endpoint.toString(), engine, ...strategy.manifest, generation: modelSettings(values),
    ids: selected.map((sample) => sample.id),
    questions: selected.map(({ id, question, answerType }) => ({ id, question, answerType })),
    modelContext: `${strategy.modelContext} + question`,
    answerValidation: 'adapter-only-single-column-v1',
    resources: { ...Object.fromEntries([...new Set(selected.map((sample) => sample.dataPath))].sort().map((path) => [path, sha256(path)])), ...strategy.resources },
    implementation: { ...implementationHashes(), 'evals/ava-workflow/evals/databench.eval.ts': sha256(fileURLToPath(import.meta.url)) },
  });
  process.stdout.write(`Predictions: ${output}\nRun artifacts: ${run}\n`);
  strategy.saveArtifacts(run);
  const pending = selected.filter((sample) => !completed.has(sample.id));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      let usage = createUsage();
      const ava = new AVA({ engine: { type: engine }, llm: { ...config, onQueryUsage: (value) => usage.add(value) } });
      const traces = traceWorkflow(ava);
      try {
        while (cursor < pending.length) {
          const sample = pending[cursor++];
          const startedAt = Date.now();
          let sql = '';
          let answer = '';
          let error = '';
          usage = createUsage();
          traces.length = 0;
          try {
            const source = { type: 'parquet' as const, options: { path: sample.dataPath } };
            await strategy.setup(ava, source);
            const result = await workflow(
              ava,
              source,
              `${sample.question}\n${answerInstruction(sample.answerType)}`,
              {
                includeSummary: false,
                strategy: strategy.config,
              },
            );
            sql = result.sql ?? '';
            if (result.truncated || result.truncatedBy) throw new Error('DataBench cannot score an incomplete result.');
            answer = answerFrom(result.data, sample.answerType);
          } catch (cause) {
            error = cause instanceof Error ? cause.message : String(cause);
            if (config.apiKey) error = error.split(config.apiKey).join('[REDACTED]');
          }
          atomicJson(join(run, 'records', `${encodeURIComponent(sample.id)}.json`), {
            id: sample.id, status: error ? 'failed' : 'success', error, sql, answer,
            elapsedMs: Date.now() - startedAt, usage: usage.value, traces,
            ...strategy.record(sample.dataPath),
          });
          appendFileSync(
            output,
            `${[
              sample.id,
              answer,
              sql,
              error,
              typeof config.model === 'string' ? config.model : config.model.modelId,
              Date.now() - startedAt,
              usage.value.inputTokens ?? '',
              usage.value.outputTokens ?? '',
              usage.value.totalTokens ?? '',
            ].map(csvCell).join(',')}\n`,
          );
          process.stdout.write(`${answer ? 'done' : 'failed'} ${sample.id}\n`);
        }
      } finally {
        await ava.dispose();
      }
    }),
  );

  plugins.forEach(registerPlugin);
  const report = await evaluate({
    samples: selected,
    predictions: predictionIndex([output]),
    metricNames: getDataset(values.dataset).defaultMetrics,
  });
  atomicJson(join(run, 'report.json'), report);
  process.stdout.write(
    `Accuracy: ${(report.metrics['databench-answer'].score * 100).toFixed(2)}% ` +
    `(${report.metrics['databench-answer'].passed}/${report.total}), missing ${report.missing}\n`,
  );
  if (report.missing) process.exitCode = 1;
}
