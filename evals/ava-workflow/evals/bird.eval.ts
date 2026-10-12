import { atomicJson, readJson, sha256 } from '../../_shared/files.js';
import { integer } from '../../_shared/args.js';
import { existsSync, mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { AVA } from '../../../lib/index.js';
import { ROOT, selectSamples, databasePath, modelQuestion, inspectResources, resultPayload } from '../../BIRD/index.js';
import { compare, scoreSamples } from '../../BIRD/score.js';
import { pendingSamples, validateResume } from '../../_shared/resume.js';
import { workflow } from '../workflow.ts';
import { llmConfig } from '../model.ts';
import { createUsage } from '../../_shared/usage.js';
import type { AnalysisStrategyConfig, LLMConfig } from '../../../lib/index.js';

type Sample = { question_id: number; db_id: string; question: string; evidence?: string };
const workflowRoot = fileURLToPath(new URL('../', import.meta.url));
const resultLimits = { maxRows: 1_000_000, maxResultBytes: 64 * 1024 * 1024 };
const HELP = `Usage: node evals/cli.js run ava-workflow --benchmark bird [options]
  DuckDB results compared with SQLite gold; thinking disabled.
  --check                 Load and profile selected databases without calling the model
  --root <path>           Dataset directory (default evals/BIRD/datasets/dev)
  --limit <number|all>    Questions to run (default 20)
  --offset <number>       Offset after filtering (default 0)
  --suite <database>      Filter database
  --id <question_id>      Repeatable question ID, including 0
  --strategy <name>       direct, loop or subset (default direct)
  --max-retries <number>  Direct execution retries (default 2)
  --max-steps <number>    Loop action budget (default 12)
  --concurrency <number>  Parallel workflows (default 1)
  --timeout <ms>          DuckDB query deadline (default 30000)
  --memory-limit <size>   DuckDB memory per workflow (default 2GB)
  --score-timeout <ms>    Per-question scoring deadline (default 60000)
  --python <path>         Python 3 with built-in sqlite3 (default python3)
  --resume                Resume --output, skipping verified successful results
  --output <directory>    Run directory (new/empty unless --resume)
  --help                 Show help
`;

export async function runSample(ava: AVA, sample: Sample, root: string, strategy: AnalysisStrategyConfig) {
  return workflow(
    ava,
    { type: 'sqlite', options: { path: databasePath(sample, root) } },
    modelQuestion({ question: sample.question, evidence: sample.evidence }) +
      '\nReturn scalar result cells (numbers, strings, booleans or null). Express durations as numbers in the units requested by the question, not INTERVAL values. Cast text dates before using DuckDB date functions.',
    { includeSummary: false, strategy, ...resultLimits }
  );
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      help: { type: 'boolean' },
      check: { type: 'boolean' },
      resume: { type: 'boolean' },
      root: { type: 'string', default: ROOT },
      limit: { type: 'string', default: '20' },
      offset: { type: 'string', default: '0' },
      suite: { type: 'string' },
      id: { type: 'string', multiple: true },
      output: { type: 'string' },
      strategy: { type: 'string', default: 'direct' },
      concurrency: { type: 'string', default: '1' },
      python: { type: 'string', default: 'python3' },
      timeout: { type: 'string', default: '30000' },
      'memory-limit': { type: 'string', default: '2GB' },
      'score-timeout': { type: 'string', default: '60000' },
      'max-retries': { type: 'string', default: '2' },
      'max-steps': { type: 'string', default: '12' },
    },
  });
  if (values.help) return process.stdout.write(HELP);
  if (values.resume && (!values.output || values.check))
    throw new Error('--resume requires --output and cannot use --check');
  if (!['direct', 'loop', 'subset'].includes(values.strategy))
    throw new Error('--strategy must be direct, loop or subset');
  const strategy: AnalysisStrategyConfig =
    values.strategy === 'direct'
      ? { type: 'direct', maxRetries: integer(values['max-retries'], 'max-retries', 0) }
      : values.strategy === 'loop'
      ? { type: 'loop', maxSteps: integer(values['max-steps'], 'max-steps') }
      : { type: 'subset' };
  const concurrency = integer(values.concurrency, 'concurrency');
  const timeout = integer(values.timeout, 'timeout');
  const scoreTimeout = integer(values['score-timeout'], 'score-timeout');
  const root = resolve(values.root);
  const samples: Sample[] = selectSamples(values, root);
  inspectResources(samples, root);
  const runtime = await compare({ action: 'check' }, { python: values.python, timeout: scoreTimeout });
  const databases = [...new Set(samples.map((sample) => sample.db_id))];
  if (values.check) {
    const ava = new AVA({
      llm: { model: 'preflight-no-model-call' },
      engine: { type: 'duckdb', queryTimeoutMs: timeout, memoryLimit: values['memory-limit'] },
    });
    try {
      for (const db of databases) {
        process.stdout.write(`Checking ${db}: loading and profiling\n`);
        await ava.source({ type: 'sqlite', options: { path: databasePath({ db_id: db }, root) } });
        await ava.profile();
        process.stdout.write(`${db}: OK\n`);
      }
    } finally {
      await ava.dispose();
    }
    process.stdout.write(`BIRD preflight OK: ${samples.length} questions, ${databases.length} databases\n`);
    return;
  }

  const config = llmConfig();
  const output = resolve(values.output ?? join(workflowRoot, `results/bird-${Date.now()}`));
  if (!values.resume && existsSync(output) && readdirSync(output).length)
    throw new Error('Choose a new or empty --output directory.');
  mkdirSync(output, { recursive: true });
  const endpoint = new URL(config.baseURL ?? 'https://api.openai.com/v1');
  endpoint.username = '';
  endpoint.password = '';
  endpoint.search = '';
  const files = [join(root, 'dev.json'), ...databases.map((db) => databasePath({ db_id: db }, root))];
  const manifest = {
    benchmark: 'bird',
    ids: samples.map((s) => String(s.question_id)),
    createdAt: new Date().toISOString(),
    model: typeof config.model === 'string' ? config.model : config.model.modelId,
    endpoint: endpoint.toString(),
    thinking: false,
    thinkingRequest: { chat_template_kwargs: { enable_thinking: false } },
    strategy,
    engine: 'duckdb-sqlite',
    mode: 'ava-result-vs-sqlite-gold',
    runtime,
    resultLimits,
    timeoutMs: timeout,
    memoryLimit: values['memory-limit'],
    scoreTimeoutMs: scoreTimeout,
    concurrency,
    modelContext: 'ava-profile + question + evidence',
    usageScope: 'onQueryUsage callbacks; subset auxiliary selector usage excluded',
    resources: Object.fromEntries(files.map((file) => [relative(root, file), sha256(file)])),
    implementation: Object.fromEntries(
      [
        fileURLToPath(import.meta.url),
        join(workflowRoot, '../_shared/resume.js'),
        join(workflowRoot, 'workflow.ts'),
        join(workflowRoot, 'model.ts'),
        join(workflowRoot, '../_shared/usage.js'),
        join(workflowRoot, '../_shared/files.js'),
        join(workflowRoot, '../_shared/args.js'),
        ...['index.js', 'score.js', 'compare.py'].map((file) => join(workflowRoot, '../BIRD', file)),
      ].map((file) => [relative(resolve(workflowRoot, '../..'), file), sha256(file)])
    ),
  };
  const lock = join(output, '.run.lock');
  writeFileSync(lock, String(process.pid), { flag: 'wx' });
  try {
    const manifestPath = join(output, 'manifest.json');
    const previous = values.resume ? readJson(manifestPath) : undefined;
    if (previous)
      validateResume(previous, manifest, [
        // Known runners before the shared resume helper; inference/scoring are unchanged.
        {
          'evals/ava-workflow/evals/bird.eval.ts': 'd683044863969b089b853a154be5b1aaed1f72dc2252f1d341ef87858d45268c',
          'evals/ava-workflow/evals/bird-resume.js': undefined,
          'evals/_shared/resume.js': undefined,
        },
        {
          'evals/ava-workflow/evals/bird.eval.ts': '1d7aa5fd1ff0a8fae1dcfe6ec9b7d54d2e75dab51ba0d6101b30a5188c80f169',
          'evals/ava-workflow/evals/bird-resume.js': 'ae20e3e1383bc48771def4ba4d21cd8b24c78a304ae953a05c5840a3a3362d5b',
          'evals/_shared/resume.js': undefined,
        },
      ]);
    const pending = previous
      ? pendingSamples(samples, output, { idKey: 'question_id', databaseKey: 'db_id', resultExtension: 'json' })
      : samples;
    if (previous) {
      atomicJson(manifestPath, {
        ...manifest,
        createdAt: previous.createdAt,
        resumes: [
          ...(previous.resumes ?? []),
          {
            resumedAt: manifest.createdAt,
            previousImplementation: previous.implementation,
            concurrency,
          },
        ],
      });
    } else {
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    }
    for (const folder of ['sql', 'exec_result', 'records']) mkdirSync(join(output, folder), { recursive: true });
    process.stdout.write(
      `Run: ${pending.length} pending, ${samples.length - pending.length} completed, concurrency ${concurrency}\n`
    );
    let cursor = 0;
    const workers = await Promise.allSettled(
      Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
        while (cursor < pending.length) {
          const sample = pending[cursor++];
          const id = String(sample.question_id);
          // Discard artifacts from interrupted/failed attempts before retrying.
          for (const file of [join(output, 'sql', `${id}.sql`), join(output, 'exec_result', `${id}.json`)]) {
            if (existsSync(file)) unlinkSync(file);
          }
          const startedAt = Date.now();
          const usage = createUsage();
          const onQueryUsage: LLMConfig['onQueryUsage'] = usage.add;
          const ava = new AVA({
            llm: { ...config, onQueryUsage },
            engine: { type: 'duckdb', queryTimeoutMs: timeout, memoryLimit: values['memory-limit'] },
          });
          for (const [event, stage] of [
            ['loadstart', 'loading'],
            ['profilestart', 'profiling'],
            ['analyzestart', 'analyzing'],
          ])
            ava.on(event, () => process.stdout.write(`${id} (${sample.db_id}): ${stage}\n`));
          let record: Record<string, unknown>;
          try {
            const result = await runSample(ava, sample, root, strategy);
            if (!result.sql?.trim()) throw new Error('Workflow returned no final SQL');
            const sql = join(output, 'sql', `${id}.sql`);
            writeFileSync(sql, result.sql + '\n');
            const prediction = join(output, 'exec_result', `${id}.json`);
            atomicJson(prediction, resultPayload(result));
            record = {
              status: 'success',
              sql_sha256: sha256(sql),
              result_sha256: sha256(prediction),
              rowCount: result.data.length,
            };
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : String(cause);
            record = {
              status: 'failed',
              error: config.apiKey ? message.split(config.apiKey).join('[REDACTED]') : message,
            };
          } finally {
            await ava.dispose();
          }
          atomicJson(join(output, 'records', `${id}.json`), {
            ...record,
            question_id: sample.question_id,
            db_id: sample.db_id,
            elapsedMs: Date.now() - startedAt,
            usage: usage.value,
          });
          process.stdout.write(`${record.status} ${id}\n`);
        }
      })
    );
    const failedWorker = workers.find((worker) => worker.status === 'rejected');
    if (failedWorker?.status === 'rejected') throw failedWorker.reason;
    const report = await scoreSamples({
      samples,
      root,
      predictions: join(output, 'exec_result'),
      output: join(output, 'report.json'),
      python: values.python,
      timeout: scoreTimeout,
    });
    if (report.missing || report.errors) process.exitCode = 1;
  } finally {
    unlinkSync(lock);
  }
}
