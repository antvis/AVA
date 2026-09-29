#!/usr/bin/env node

const { writeFileSync } = require('node:fs');
const { parseArgs } = require('node:util');

const { evaluate, getDataset, loadPlugin, predictionIndex } = require('./_shared');
const { takeOptions } = require('./_shared/args');

const adapters = {
  'ava-workflow': { databench: () => import('./ava-workflow/evals/databench.eval.ts') },
  'ava-agent': { databench: () => import('./ava-agent/evals/databench.eval.ts') },
};

const HELP = `Usage (from repository root):
  node evals/cli.js run <ava-workflow|ava-agent> --benchmark <name> [options]
  node evals/cli.js score --predictions <file.csv> [options]

Use run <target> --benchmark databench --help for target options.
Download DataBench separately: node evals/databench/fetch.js

Score options:
  --dataset <name>       Dataset plugin name (default: databench-lite)
  --plugin <path>        Load a CommonJS dataset plugin; repeatable
  --data <path>          CSV file or directory; repeatable
  --predictions <path>   Prediction CSV; repeatable
  --metrics <names>      Comma-separated metrics (default depends on dataset)
  --output <path>        Write a new JSON report
  --help                Show help
`;

function writeNew(path, content) {
  writeFileSync(path, content, { encoding: 'utf8', flag: 'wx' });
}

async function score(args) {
  const { values } = parseArgs({
    args,
    options: {
      data: { type: 'string', multiple: true },
      dataset: { type: 'string', default: 'databench-lite' },
      help: { type: 'boolean' },
      metrics: { type: 'string' },
      output: { type: 'string' },
      plugin: { type: 'string', multiple: true },
      predictions: { type: 'string', multiple: true },
    },
  });
  if (values.help) return process.stdout.write(HELP);

  values.plugin?.forEach(loadPlugin);
  if (!values.predictions?.length) throw new Error(`--predictions is required.\n\n${HELP}`);
  const plugin = getDataset(values.dataset);
  const samples = plugin.load(values.data?.length ? values.data : undefined);

  const report = await evaluate({
    samples,
    predictions: predictionIndex(values.predictions),
    metricNames: (values.metrics ?? plugin.defaultMetrics?.join(',') ?? 'databench-answer')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  });
  if (values.output) writeNew(values.output, `${JSON.stringify(report, null, 2)}\n`);

  process.stdout.write(`Samples: ${report.total}\nPredicted: ${report.predicted}\nMissing: ${report.missing}\n`);
  for (const [name, result] of Object.entries(report.metrics)) {
    process.stdout.write(`${name}: ${(result.score * 100).toFixed(2)}% (${result.passed}/${result.total})\n`);
  }
  for (const [suite, result] of Object.entries(report.suites)) {
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
  if (command === 'score') return score(args);
  throw new Error(`Unknown command: ${command}.\n\n${HELP}`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
