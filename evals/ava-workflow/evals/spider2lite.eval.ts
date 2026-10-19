import { atomicJson, readJson, sha256 } from '../../_shared/files.js';
import { integer } from '../../_shared/args.js';
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { AVA } from '../../../lib/index.js';
import { csvCell } from '../../_shared/results.js';
import { ROOT, inspectResources, modelQuestion, modelEvidence, selectSamples } from '../../spider2lite/index.js';
import { checkScorer, pythonPath, scoreSamples } from '../../spider2lite/score.js';
import { pendingSamples, validateResume } from '../../_shared/resume.js';
import { workflow } from '../workflow.ts';
import { strategyConfig } from '../strategies.ts';
import { llmConfig } from '../model.ts';
import { createUsage } from '../../_shared/usage.js';

import type { AnalysisStrategyConfig, LLMConfig } from '../../../lib/index.js';

type Sample = { instance_id: string; db: string; question: string; external_knowledge?: string };
const resultLimits = { maxRows: 10_000, maxResultBytes: 64 * 1024 * 1024 };
const workflowRoot = fileURLToPath(new URL('../', import.meta.url));

const HELP = `Usage: node evals/cli.js run ava-workflow --benchmark spider2lite [options]
  SQLite subset only. DuckDB execution; official CSV result comparison.
  --check                 Full load/profile check: no model calls, no run directory
  --root <path>           Dataset directory (default evals/spider2lite)
  --limit <number|all>    Questions to run (default 20)
  --offset <number>       Start after filtering (default 0)
  --suite <database>      Filter database name
  --id <instance_id>      Repeatable local question ID
  --strategy <name>       direct, loop, subset or apex (default direct)
  --samples <n>           APEX independent candidates, 1–8 (default 1)
  --ablation <name>       APEX: no-planning, no-exploration or no-guidance
  --max-retries <number>  Direct execution correction retries (default 2)
  --max-steps <number>    Action budget (loop: 12; apex: 40)
  --concurrency <number>  Parallel workflows (default 1)
  --python <path>         Python for official scorer
  --timeout <ms>          DuckDB query deadline (default 30000)
  --score-timeout <ms>    Per-question scoring deadline (default 60000)
  --max-context-bytes <n> Fail rather than truncate reference material (default 4194304)
  --resume                Resume an existing --output directory
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
    strategy.type === 'apex' ? sample.question : modelQuestion(sample, root, maxContextBytes),
    {
      includeSummary: false,
      strategy: strategy.type === 'apex'
        ? { ...strategy, evidence: modelEvidence(sample, root, maxContextBytes) }
        : strategy,
      ...resultLimits,
    }
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
      python: { type: 'string' },
      timeout: { type: 'string', default: '30000' },
      'score-timeout': { type: 'string', default: '60000' },
      'max-context-bytes': { type: 'string', default: '4194304' },
      'max-retries': { type: 'string', default: '2' },
      'max-steps': { type: 'string' },
      samples: { type: 'string' },
      ablation: { type: 'string' },
    },
  });
  if (values.help) return process.stdout.write(HELP);
  if (values.resume && (!values.output || values.check))
    throw new Error('--resume requires --output and cannot use --check');
  const strategy = strategyConfig(values);
  const concurrency = integer(values.concurrency, 'concurrency');
  const timeout = integer(values.timeout, 'timeout');
  const scoreTimeout = integer(values['score-timeout'], 'score-timeout');
  const maxContextBytes = integer(values['max-context-bytes'], 'max-context-bytes');
  const root = resolve(values.root);
  const python = values.python ?? pythonPath();
  const samples: Sample[] = selectSamples(values, root);
  const databases = [...new Set(samples.map((sample) => sample.db))];
  process.stdout.write(
    `Preflight: checking resources for ${samples.length} questions, ${databases.length} databases\n`
  );
  // Normal runs validate resources without scanning every database before the first case.
  inspectResources(samples, root, { maxContextBytes });
  process.stdout.write('Preflight: checking official scorer dependencies\n');
  const runtime = await checkScorer(root, { python, timeout: scoreTimeout });
  if (values.check) {
    const probe = new AVA({
      llm: { model: 'preflight-no-model-call' },
      engine: { type: 'duckdb', queryTimeoutMs: timeout },
    });
    try {
      for (const [index, db] of databases.entries()) {
        const label = `Check ${index + 1}/${databases.length} ${db}`;
        const startedAt = Date.now();
        process.stdout.write(`${label}: loading\n`);
        await probe.source({
          type: 'sqlite',
          options: { path: join(root, 'resource/databases/spider2-localdb', `${db}.sqlite`) },
        });
        process.stdout.write(`${label}: profiling\n`);
        await probe.profile();
        process.stdout.write(`${label}: OK (${Date.now() - startedAt}ms)\n`);
      }
    } finally {
      await probe.dispose();
    }
    process.stdout.write('Full database check OK\n');
    return;
  }
  process.stdout.write('Preflight OK: resources and scorer ready; databases load during each case\n');

  const config = llmConfig();
  const output = resolve(values.output ?? join(workflowRoot, `results/spider2lite-${values.strategy}`));
  const endpoint = new URL(config.baseURL);
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
    mode: 'exec_result',
    resultSource: 'ava-result',
    resultLimits,
    modelContext: strategy.type === 'apex' ? 'ava-schema + question + separate external-knowledge' : 'ava-profile + question + external-knowledge',
    timeoutMs: timeout,
    scoreTimeoutMs: scoreTimeout,
    maxContextBytes,
    concurrency,
    usageScope: 'Accumulated onQueryUsage callbacks; subset auxiliary selector usage is not included',
    implementation: Object.fromEntries(
      [
        fileURLToPath(import.meta.url),
        join(workflowRoot, '../_shared/resume.js'),
        join(workflowRoot, 'workflow.ts'),
        join(workflowRoot, 'strategies.ts'),
        ...['index', 'runtime', 'schema', 'linking', 'guidance', 'agent'].map((file) => join(workflowRoot, '../../lib/analysis/apex', `${file}.js`)),
        join(workflowRoot, 'model.ts'),
        join(workflowRoot, '../_shared/model-env.js'),
        join(workflowRoot, '../_shared/usage.js'),
        join(workflowRoot, '../_shared/files.js'),
        join(workflowRoot, '../_shared/args.js'),
        join(workflowRoot, '../spider2lite/index.js'),
        join(workflowRoot, '../spider2lite/score.js'),
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
    if (values.resume && !existsSync(manifestPath)) throw new Error('No manifest found in --output directory.');
    const previous = existsSync(manifestPath) ? readJson(manifestPath) : undefined;
    if (previous)
      validateResume(previous.spec, spec, [
        // The previous runner already supported automatic resume with identical selections.
        {
          'evals/ava-workflow/evals/spider2lite.eval.ts':
            '879a256700b57908afd24e40944c82253389f87d1686b85406f56685c05b81ea',
          'evals/_shared/resume.js': undefined,
        },
      ]);
    const sqlDir = join(output, 'sql');
    const records = join(output, 'records');
    const resultDir = join(output, 'exec_result');
    mkdirSync(sqlDir, { recursive: true });
    mkdirSync(records, { recursive: true });
    mkdirSync(resultDir, { recursive: true });
    const pending = pendingSamples(samples, output, {
      idKey: 'instance_id',
      databaseKey: 'db',
      resultExtension: 'csv',
    });
    atomicJson(manifestPath, {
      ...spec,
      spec,
      createdAt: previous?.createdAt ?? new Date().toISOString(),
      ...(previous
        ? {
            resumes: [
              ...(previous.resumes ?? []),
              {
                resumedAt: new Date().toISOString(),
                previousImplementation: previous.spec.implementation,
                concurrency,
              },
            ],
          }
        : {}),
    });
    process.stdout.write(
      `Run: ${pending.length} pending, ${samples.length - pending.length} completed, concurrency ${concurrency}\n`
    );
    let cursor = 0;
    const workers = await Promise.allSettled(
      Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
        while (cursor < pending.length) {
          const sample = pending[cursor++];
          const startedAt = Date.now();
          const usage = createUsage();
          let lastSQL = '';
          const traces: unknown[] = [];
          const onQueryUsage: LLMConfig['onQueryUsage'] = usage.add;
          const ava = new AVA({
            llm: { ...config, onQueryUsage },
            engine: { type: 'duckdb', queryTimeoutMs: timeout },
          });
          if (strategy.type === 'apex') ava.on('reasonend', (event: { data: unknown }) => traces.push({ event: 'apex', data: event.data }));
          // General stage progress is console-only; APEX additionally retains its reasoning events.
          for (const [event, stage] of [
            ['sourcestart', 'loading'],
            ['profilestart', 'profiling'],
            ['analyzestart', 'analyzing'],
          ]) {
            ava.on(event, () => process.stdout.write(`${sample.instance_id} (${sample.db}): ${stage}\n`));
          }
          // Capture executable DSL and diagnostics, not raw reasoning transcripts or gold.
          for (const eventName of ['querystart', 'queryend']) {
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
          const resultPath = join(resultDir, `${sample.instance_id}.csv`);
          if (existsSync(sqlPath)) unlinkSync(sqlPath);
          if (existsSync(resultPath)) unlinkSync(resultPath);
          let record: Record<string, unknown>;
          try {
            const result = await runSample(ava, sample, root, strategy, maxContextBytes);
            if (!result.sql?.trim()) throw new Error('Workflow returned no final SQL');
            const temp = sqlPath + '.tmp';
            writeFileSync(temp, result.sql + '\n');
            renameSync(temp, sqlPath);
            if (result.truncated) throw new Error(`Workflow result truncated by ${result.truncatedBy}`);
            const columns = result.schema.map((column) => column.name);
            const csv = [columns, ...result.data.map((row) => columns.map((name) => row[name]))]
              .map((row) => row.map(csvCell).join(','))
              .join('\n');
            writeFileSync(resultPath + '.tmp', csv + '\n');
            renameSync(resultPath + '.tmp', resultPath);
            record = {
              status: 'success',
              ...(result.apex ? { apex: result.apex } : {}),
              sql_sha256: sha256(sqlPath),
              result_sha256: sha256(resultPath),
              rowCount: result.data.length,
            };
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
            usage: usage.value,
            traces,
          };
          atomicJson(join(records, `${sample.instance_id}.json`), record);
          appendFileSync(join(output, 'attempts.jsonl'), JSON.stringify(record) + '\n');
          process.stdout.write(`${record.status} ${sample.instance_id}\n`);
        }
      })
    );
    const failedWorker = workers.find((worker) => worker.status === 'rejected');
    if (failedWorker?.status === 'rejected') throw failedWorker.reason;
    const report = await scoreSamples({
      samples,
      root,
      predictions: resultDir,
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
