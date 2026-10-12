import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { AVA } from '../../../lib/index.js';
import {
  ROOT,
  integer,
  inspectResources,
  modelQuestion,
  readJson,
  selectSamples,
  sha256,
} from '../../spider2lite/index.js';
import { atomicJson, checkScorer, pythonPath, scoreSamples } from '../../spider2lite/score.js';
import { workflow } from '../workflow.ts';
import { llmConfig } from './databench.eval.ts';

import type { AnalysisStrategyConfig, LLMConfig } from '../../../lib/index.js';

type Sample = { instance_id: string; db: string; question: string; external_knowledge?: string };
const workflowRoot = fileURLToPath(new URL('../', import.meta.url));

const HELP = `Usage: node evals/cli.js run ava-workflow --benchmark spider2lite [options]
  SQLite subset only. DuckDB SQLite extension; official SQLite result scoring.
  --check                 Preflight only: no model calls, no run directory
  --root <path>           Dataset directory (default evals/spider2lite)
  --limit <number|all>    Questions to run (default 20)
  --offset <number>       Start after filtering (default 0)
  --suite <database>      Filter database name
  --id <instance_id>      Repeatable local question ID
  --strategy <name>       direct, loop or subset (default direct)
  --max-retries <number>  Direct execution correction retries (default 2)
  --max-steps <number>    Loop action budget (default 12)
  --concurrency <number>  Parallel workflows (default 1)
  --python <path>         Python for official scorer
  --timeout <ms>          DuckDB query deadline (default 30000)
  --score-timeout <ms>    Per-question scoring deadline (default 60000)
  --max-context-bytes <n> Fail rather than truncate reference material (default 4194304)
  --output <directory>    Run directory (default results/spider2lite-<strategy>)
  --help                 Show help without loading model/data
`;

/** No gold, scoring conditions or reference answers are passed to this function. */
export async function runSample(
  ava: AVA,
  sample: Sample,
  root: string,
  strategy: AnalysisStrategyConfig,
  maxContextBytes: number
) {
  return workflow(
    ava,
    { type: 'sqlite', options: { path: join(root, 'resource/databases/spider2-localdb', `${sample.db}.sqlite`) } },
    modelQuestion(sample, root, maxContextBytes),
    { includeSummary: false, strategy }
  );
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      help: { type: 'boolean' },
      check: { type: 'boolean' },
      root: { type: 'string', default: ROOT },
      limit: { type: 'string', default: '20' },
      offset: { type: 'string', default: '0' },
      suite: { type: 'string' },
      id: { type: 'string', multiple: true },
      output: { type: 'string' },
      strategy: { type: 'string', default: 'direct' },
      concurrency: { type: 'string', default: '1' },
      python: { type: 'string' },
      timeout: { type: 'string', default: '30000' },
      'score-timeout': { type: 'string', default: '60000' },
      'max-context-bytes': { type: 'string', default: '4194304' },
      'max-retries': { type: 'string', default: '2' },
      'max-steps': { type: 'string', default: '12' },
    },
  });
  if (values.help) return process.stdout.write(HELP);
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
  const maxContextBytes = integer(values['max-context-bytes'], 'max-context-bytes');
  const root = resolve(values.root);
  const python = values.python ?? pythonPath();
  const samples: Sample[] = selectSamples(values, root);
  // Fail missing data/dependencies before obtaining model configuration or creating output.
  inspectResources(samples, root, { maxContextBytes });
  const runtime = await checkScorer(root, { python, timeout: scoreTimeout });
  const probe = new AVA({
    llm: { model: 'preflight-no-model-call' },
    engine: { type: 'duckdb', queryTimeoutMs: timeout },
  });
  try {
    for (const db of new Set(samples.map((s) => s.db))) {
      await probe.source({
        type: 'sqlite',
        options: { path: join(root, 'resource/databases/spider2-localdb', `${db}.sqlite`) },
      });
    }
  } finally {
    await probe.dispose();
  }
  process.stdout.write(
    `Preflight OK: ${samples.length} SQLite questions, DuckDB SQLite extension; scorer SQLite ${runtime.sqlite}\n`
  );
  if (values.check) return;

  const config = llmConfig();
  const output = resolve(values.output ?? join(workflowRoot, `results/spider2lite-${values.strategy}`));
  const endpoint = new URL(config.baseURL ?? 'https://api.openai.com/v1');
  endpoint.username = '';
  endpoint.password = '';
  endpoint.search = '';
  const spec = {
    benchmark: 'spider2lite',
    scope: 'SQLite subset',
    ids: samples.map((s) => s.instance_id),
    runtime,
    model: typeof config.model === 'string' ? config.model : config.model.modelId,
    endpoint: endpoint.toString(),
    thinking: false,
    strategy,
    engine: 'duckdb-sqlite',
    modelContext: 'ava-profile + question + external-knowledge',
    timeoutMs: timeout,
    scoreTimeoutMs: scoreTimeout,
    maxContextBytes,
    concurrency,
    usageScope: 'Accumulated onQueryUsage callbacks; subset auxiliary selector usage is not included',
    implementation: Object.fromEntries(
      [
        fileURLToPath(import.meta.url),
        join(workflowRoot, 'workflow.ts'),
        join(workflowRoot, 'evals/databench.eval.ts'),
        join(workflowRoot, '../spider2lite/index.js'),
        ...[
          'duckdb/engine.js',
          'duckdb/loaders/sqlite.js',
          'query/duckdb.js',
          'analysis/direct.js',
          'analysis/loop.js',
          'analysis/subset.js',
        ].map((p) => join(workflowRoot, '../../lib', p)),
      ].map((p) => [p.replace(resolve(workflowRoot, '../..') + '/', ''), sha256(p)])
    ),
  };
  mkdirSync(output, { recursive: true });
  const lockPath = join(output, '.run.lock');
  const lock = openSync(lockPath, 'wx');
  closeSync(lock);
  try {
    const manifestPath = join(output, 'manifest.json');
    if (existsSync(manifestPath)) {
      if (JSON.stringify(readJson(manifestPath).spec) !== JSON.stringify(spec))
        throw new Error('Run configuration/resources changed. Choose a new --output directory.');
    } else {
      atomicJson(manifestPath, { ...spec, spec, createdAt: new Date().toISOString() });
    }
    const sqlDir = join(output, 'sql');
    const records = join(output, 'records');
    mkdirSync(sqlDir, { recursive: true });
    mkdirSync(records, { recursive: true });
    const pending = samples.filter((sample) => {
      const record = join(records, `${sample.instance_id}.json`);
      if (!existsSync(record) || readJson(record).status !== 'success') return true;
      const sql = join(sqlDir, `${sample.instance_id}.sql`);
      if (!existsSync(sql) || sha256(sql) !== readJson(record).sql_sha256)
        throw new Error(`Prediction changed: ${sample.instance_id}. Use a new output directory.`);
      return false;
    });
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
        while (cursor < pending.length) {
          const sample = pending[cursor++];
          const startedAt = Date.now();
          const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, calls: 0 };
          let lastSQL = '';
          const traces: unknown[] = [];
          const onQueryUsage: LLMConfig['onQueryUsage'] = (value) => {
            usage.inputTokens += value.inputTokens ?? 0;
            usage.outputTokens += value.outputTokens ?? 0;
            usage.totalTokens += value.totalTokens ?? 0;
            usage.calls++;
          };
          const ava = new AVA({
            llm: { ...config, onQueryUsage },
            engine: { type: 'duckdb', queryTimeoutMs: timeout },
          });
          // Capture executable DSL and diagnostics, not raw reasoning transcripts or gold.
          for (const eventName of ['translateend', 'querystart', 'queryend']) {
            ava.on(eventName, (event: { data?: { dsl?: string; error?: unknown; truncated?: boolean } }) => {
              if (event.data?.dsl) lastSQL = event.data.dsl;
              traces.push({
                event: eventName,
                dsl: event.data?.dsl,
                error: event.data?.error,
                truncated: event.data?.truncated,
              });
            });
          }
          const sqlPath = join(sqlDir, `${sample.instance_id}.sql`);
          if (existsSync(sqlPath)) unlinkSync(sqlPath);
          let record: Record<string, unknown>;
          try {
            const result = await runSample(ava, sample, root, strategy, maxContextBytes);
            if (!result.sql?.trim()) throw new Error('Workflow returned no final SQL');
            const temp = sqlPath + '.tmp';
            writeFileSync(temp, result.sql + '\n');
            renameSync(temp, sqlPath);
            record = { status: 'success', sql_sha256: sha256(sqlPath), previewTruncated: !!result.truncated };
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : String(cause);
            record = {
              status: 'failed',
              error: config.apiKey ? message.split(config.apiKey).join('[REDACTED]') : message,
              lastSQL,
            };
          } finally {
            await ava.dispose();
          }
          record = {
            ...record,
            instance_id: sample.instance_id,
            db: sample.db,
            elapsedMs: Date.now() - startedAt,
            usage,
            traces,
          };
          atomicJson(join(records, `${sample.instance_id}.json`), record);
          appendFileSync(join(output, 'attempts.jsonl'), JSON.stringify(record) + '\n');
          process.stdout.write(`${record.status} ${sample.instance_id}\n`);
        }
      })
    );
    const report = await scoreSamples({
      samples,
      root,
      predictions: sqlDir,
      output: join(output, 'report.json'),
      python,
      timeout: scoreTimeout,
      concurrency,
      runtime,
    });
    if (report.missing || report.errors) process.exitCode = 1;
  } finally {
    unlinkSync(lockPath);
  }
}
