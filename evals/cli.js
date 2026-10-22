#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { evaluate, getDataset, loadPlugin, predictionIndex, registerPlugin } from './_shared/index.js';
import { takeOptions } from './_shared/args.js';
import { buildReport } from './_shared/report.js';
import { plugins } from './databench/index.js';

const adapters = {
  'ava-workflow': {
    databench: () => import('./ava-workflow/evals/databench.eval.ts'),
    spider2lite: () => import('./ava-workflow/evals/spider2lite.eval.ts'),
    bird: () => import('./ava-workflow/evals/bird.eval.ts'),
  },
  'ava-agent': {
    databench: () => import('./ava-agent/evals/databench.eval.ts'),
    bird: () => import('./ava-agent/evals/bird.eval.ts'),
    spider2lite: () => import('./ava-agent/evals/spider2lite.eval.ts'),
  },
};

const HELP = `Usage (from repository root):
  node evals/cli.js run <ava-workflow|ava-agent> --benchmark <name> [options]
  node evals/cli.js score --predictions <file.csv> [options]

Use run <target> --benchmark <databench|spider2lite|bird> --help for target options.
Download DataBench separately: node evals/databench/fetch.js
Download Spider2-Lite resources: node evals/spider2lite/fetch.js
Download BIRD dev: node evals/BIRD/fetch.js
BIRD scoring: score --dataset bird --predictions <run-dir> --help
Spider2-Lite scoring: score --dataset spider2lite --predictions <run-dir> --help

Score options:
  --dataset <name>       Dataset plugin name (default: databench-lite)
  --plugin <path>        Load an ESM or CommonJS dataset plugin; repeatable
  --data <path>          CSV file or directory; repeatable
  --predictions <path>   Prediction CSV; repeatable
  --metrics <names>      Comma-separated metrics (default depends on dataset)
  --metadata <path>      JSON with evaluation and provenance metadata
  --output <path>        Write a JSON report, overwriting an existing file
  --help                Show help
`;

async function score(args) {
  const { values } = parseArgs({
    args,
    options: {
      data: { type: 'string', multiple: true },
      dataset: { type: 'string', default: 'databench-lite' },
      help: { type: 'boolean' },
      metrics: { type: 'string' },
      metadata: { type: 'string' },
      output: { type: 'string' },
      plugin: { type: 'string', multiple: true },
      predictions: { type: 'string', multiple: true },
    },
  });
  if (values.help) return process.stdout.write(HELP);

  plugins.forEach(registerPlugin);
  for (const path of values.plugin ?? []) await loadPlugin(path);
  if (!values.predictions?.length) throw new Error(`--predictions is required.\n\n${HELP}`);
  const plugin = getDataset(values.dataset);
  const samples = plugin.load(values.data?.length ? values.data : undefined);

  const scores = await evaluate({
    samples,
    predictions: predictionIndex(values.predictions),
    metricNames: values.metrics === undefined ? plugin.defaultMetrics : values.metrics.split(',').map((name) => name.trim()).filter(Boolean),
  });
  const report = buildReport(scores, samples, values, plugin);
  if (values.output) writeFileSync(values.output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  process.stdout.write(`Samples: ${scores.total}\nPredicted: ${scores.predicted}\nMissing: ${scores.missing}\n`);
  for (const [name, result] of Object.entries(scores.metrics)) {
    process.stdout.write(`${name}: ${(result.score * 100).toFixed(2)}% (${result.passed}/${scores.total})\n`);
  }
  for (const [suite, result] of Object.entries(scores.suites)) {
    const scores = Object.entries(result.metrics)
      .map(([name, metric]) => `${name} ${(metric.score * 100).toFixed(2)}%`)
      .join(', ');
    process.stdout.write(`${suite}: ${result.predicted}/${result.total}, ${scores}\n`);
  }
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (!command || command === '--help') return process.stdout.write(HELP);
  if (command === 'run') {
    const [target, ...options] = args;
    if (!target || target === '--help') return process.stdout.write(HELP);
    if (!Object.hasOwn(adapters, target)) throw new Error(`Unknown target: ${target}.`);
    const { values, rest } = takeOptions(options, { benchmark: { type: 'string' } });
    const available = adapters[target];
    if (!Object.hasOwn(available, values.benchmark)) {
      throw new Error(`Choose --benchmark from: ${Object.keys(available).join(', ')}.`);
    }
    const { main: run } = await available[values.benchmark]();
    return run(rest);
  }
  if (command === 'score') {
    const { values } = takeOptions(args, { dataset: { type: 'string' } });
    if (values.dataset === 'spider2lite') return (await import('./spider2lite/score.js')).main(args);
    if (values.dataset === 'bird') return (await import('./BIRD/score.js')).main(args);
    return score(args);
  }
  throw new Error(`Unknown command: ${command}.\n\n${HELP}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export { main };
