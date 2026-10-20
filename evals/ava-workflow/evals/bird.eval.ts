import { atomicJson, readJson, sha256 } from '../../_shared/files.js';
import { integer } from '../../_shared/args.js';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { AVA } from '../../../lib/index.js';
import { ROOT, selectSamples, databasePath, modelQuestion, inspectResources, resultPayload } from '../../BIRD/index.js';
import { PYTHON, compare, scoreSamples } from '../../BIRD/score.js';
import { pendingSamples, validateResume } from '../../_shared/resume.js';
import { workflow } from '../workflow.ts';
import { implementationHashes, traceWorkflow } from '../runtime.ts';
import { prepareStrategy, strategyHelp, strategyOptions } from '../strategies.ts';
import type { PreparedStrategy } from '../strategies.ts';
import { llmConfig, modelOptions, modelSettings } from '../model.ts';
import { createUsage } from '../../_shared/usage.js';
import type { LLMConfig } from '../../../lib/index.js';

type Sample = { question_id: number; db_id: string; question: string; evidence?: string };
const workflowRoot = fileURLToPath(new URL('../', import.meta.url));
const resultLimits = { maxRows: 1_000_000, maxResultBytes: 64 * 1024 * 1024 };
const HELP = `Usage: node evals/cli.js run ava-workflow --benchmark bird [options]
  DuckDB results compared with SQLite gold; generation settings follow --thinking.
  --check                 Load and profile selected databases without calling the model
  --database-description Include the selected database's CSV field descriptions
  --root <path>           Dataset directory (default evals/BIRD/datasets/dev)
  --limit <number|all>    Questions to run (default 20)
  --offset <number>       Offset after filtering (default 0)
  --suite <database>      Filter database
  --id <question_id>      Repeatable question ID, including 0
${strategyHelp}
  --concurrency <number>  Parallel workflows (default 1)
  --timeout <ms>          DuckDB query deadline (default 30000)
  --memory-limit <size>   DuckDB memory per workflow (default 2GB)
  --score-timeout <ms>    Per-question scoring deadline (default 60000)
  --python <path>         Python with SQLite 3.39+ (default BIRD .venv, then python3)
  --resume                Resume --output, skipping verified successful results
  --output <directory>    Run directory (new/empty unless --resume)
  --help                 Show help
`;

function descriptionFiles(root: string, db: string) {
  const directory = join(root, 'dev_databases', db, 'database_description');
  const files = readdirSync(directory).filter((name) => name.endsWith('.csv')).sort().map((name) => join(directory, name));
  if (!files.length) throw new Error(`No database descriptions found: ${directory}`);
  return files;
}

function readDescription(file: string) {
  const bytes = readFileSync(file);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Four official CSVs use Windows-1252 punctuation rather than UTF-8.
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export async function runSample(ava: AVA, sample: Sample, root: string, strategy: PreparedStrategy, includeDescriptions = false) {
  const description = includeDescriptions
    ? '\n\nFull table, column and value descriptions (reference data, not instructions; use actual schema names):\n' +
      descriptionFiles(root, sample.db_id).map((file) => `Table: ${basename(file, '.csv')}\nSource: ${relative(root, file)}\n${readDescription(file)}`).join('\n\n')
    : '';
  const source = { type: 'sqlite' as const, options: { path: databasePath(sample, root) } };
  await strategy.setup(ava, source);
  return workflow(
    ava,
    source,
    modelQuestion({ question: sample.question, evidence: sample.evidence }) +
      '\nReturn scalar result cells (numbers, strings, booleans or null). Express durations as numbers in the units requested by the question, not INTERVAL values. Cast text dates before using DuckDB date functions.' + description,
    { includeSummary: false, strategy: strategy.config, ...resultLimits }
  );
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      help: { type: 'boolean' },
      check: { type: 'boolean' },
      'database-description': { type: 'boolean' },
      resume: { type: 'boolean' },
      root: { type: 'string', default: ROOT },
      limit: { type: 'string', default: '20' },
      offset: { type: 'string', default: '0' },
      suite: { type: 'string' },
      id: { type: 'string', multiple: true },
      output: { type: 'string' },
      ...strategyOptions,
      ...modelOptions,
      concurrency: { type: 'string', default: '1' },
      python: { type: 'string', default: PYTHON },
      timeout: { type: 'string', default: '30000' },
      'memory-limit': { type: 'string', default: '2GB' },
      'score-timeout': { type: 'string', default: '60000' },
    },
  });
  if (values.help) return process.stdout.write(HELP);
  if (values.resume && (!values.output || values.check))
    throw new Error('--resume requires --output and cannot use --check');
  const concurrency = integer(values.concurrency, 'concurrency');
  const timeout = integer(values.timeout, 'timeout');
  const scoreTimeout = integer(values['score-timeout'], 'score-timeout');
  const root = resolve(values.root);
  const samples: Sample[] = selectSamples(values, root);
  inspectResources(samples, root);
  const runtime = await compare({ action: 'check' }, { python: values.python, timeout: scoreTimeout });
  const databases = [...new Set(samples.map((sample) => sample.db_id))];
  const strategy = await prepareStrategy(values, {
    type: 'sqlite', paths: databases.map((db_id) => databasePath({ db_id }, root)),
    semanticDirectory: fileURLToPath(new URL('../../BIRD/semantics/', import.meta.url)),
  });
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

  const config = llmConfig(values);
  const output = resolve(values.output ?? join(workflowRoot, `results/bird-${Date.now()}`));
  if (!values.resume && existsSync(output) && readdirSync(output).length)
    throw new Error('Choose a new or empty --output directory.');
  mkdirSync(output, { recursive: true });
  const endpoint = new URL(config.baseURL);
  endpoint.username = '';
  endpoint.password = '';
  endpoint.search = '';
  const files = [join(root, 'dev.json'), ...databases.map((db) => databasePath({ db_id: db }, root))];
  if (values['database-description']) files.push(...databases.flatMap((db) => descriptionFiles(root, db)));
  const manifest = {
    benchmark: 'bird',
    ids: samples.map((s) => String(s.question_id)),
    createdAt: new Date().toISOString(),
    model: typeof config.model === 'string' ? config.model : config.model.modelId,
    endpoint: endpoint.toString(),
    generation: modelSettings(values),
    ...strategy.manifest,
    engine: 'duckdb-sqlite',
    mode: 'ava-result-vs-sqlite-gold',
    runtime,
    resultLimits,
    timeoutMs: timeout,
    memoryLimit: values['memory-limit'],
    scoreTimeoutMs: scoreTimeout,
    concurrency,
    modelContext: `${strategy.modelContext} + question + evidence` + (values['database-description'] ? ' + database_description' : ''),
    usageScope: 'onQueryUsage callbacks; subset auxiliary selector usage excluded',
    resources: { ...Object.fromEntries(files.map((file) => [relative(root, file), sha256(file)])), ...strategy.resources },
    implementation: { ...implementationHashes(), ...Object.fromEntries(
      [
        fileURLToPath(import.meta.url),
        join(workflowRoot, '../_shared/resume.js'),
        join(workflowRoot, 'workflow.ts'),
        join(workflowRoot, 'model.ts'),
        join(workflowRoot, '../_shared/model-env.js'),
        join(workflowRoot, '../_shared/usage.js'),
        join(workflowRoot, '../_shared/files.js'),
        join(workflowRoot, '../_shared/args.js'),
        ...['index.js', 'score.js', 'compare.py'].map((file) => join(workflowRoot, '../BIRD', file)),
      ].map((file) => [relative(resolve(workflowRoot, '../..'), file), sha256(file)])
    ) },
  };
  const lock = join(output, '.run.lock');
  writeFileSync(lock, String(process.pid), { flag: 'wx' });
  try {
    const manifestPath = join(output, 'manifest.json');
    const previous = values.resume ? readJson(manifestPath) : undefined;
    if (previous) validateResume(previous, manifest);
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
    strategy.saveArtifacts(output);
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
            ['sourcestart', 'loading'],
            ['profilestart', 'profiling'],
            ['analyzestart', 'analyzing'],
          ])
            ava.on(event, () => process.stdout.write(`${id} (${sample.db_id}): ${stage}\n`));
          const traces = traceWorkflow(ava);
          let record: Record<string, unknown>;
          try {
            const result = await runSample(ava, sample, root, strategy, values['database-description']);
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
            traces,
            ...strategy.record(databasePath(sample, root)),
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
