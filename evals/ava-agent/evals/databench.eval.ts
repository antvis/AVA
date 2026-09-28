import { appendFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { defineEval, defineEvalConfig } from 'eve/evals';
import { equals } from 'eve/evals/expect';

import { hashTree } from '../lib/files.mjs';

type Benchmark = typeof import('../../databench/index.js');
const require = createRequire(import.meta.url);

export const config = defineEvalConfig({ maxConcurrency: 1, timeoutMs: 180000 });

const evalsRoot = fileURLToPath(new URL('../../', import.meta.url));
const HELP = `Usage (from repository root):
  node evals/cli.js run ava-agent --benchmark databench [options]

Options:
  --dataset <name>       databench-lite or databench (default: databench-lite)
  --limit <number|all>   Questions to run (default: 20)
  --offset <number>      Start offset after filtering (default: 0)
  --suite <name>         Run one dataset, e.g. 002_Titanic
  --skill <ava|none>     Require AVA Skill or run without it (default: ava)
  --list                List selected cases without model calls

Additional execution options are forwarded to Eve.
`;

function prepareSnapshot(
  directory: string,
  samples: ReturnType<Benchmark['selectSamples']>,
  selection: Parameters<Benchmark['selectSamples']>[0]
) {
  // Gold answers stay on the host; only Parquet files are attached to agent sessions.
  const benchmarkDirectory = join(directory, 'benchmarks');
  writeFileSync(join(directory, 'evals/evals.config.ts'), "export { config as default } from './databench.eval.ts';\n");
  mkdirSync(join(benchmarkDirectory, 'databench'), { recursive: true });
  mkdirSync(join(benchmarkDirectory, '_shared'), { recursive: true });
  writeFileSync(join(benchmarkDirectory, 'package.json'), '{"type":"commonjs"}\n');
  cpSync(join(evalsRoot, 'databench/index.js'), join(benchmarkDirectory, 'databench/index.js'));
  cpSync(join(evalsRoot, '_shared/datasets.js'), join(benchmarkDirectory, '_shared/datasets.js'));
  const files = new Map();
  for (const sample of samples) {
    if (!files.has(sample.dataPath)) {
      const attachment = `evals/fixtures/databench/${files.size}.parquet`;
      mkdirSync(join(directory, 'evals/fixtures/databench'), { recursive: true });
      cpSync(sample.dataPath, join(directory, attachment));
      files.set(sample.dataPath, attachment);
    }
    sample.dataPath = files.get(sample.dataPath);
  }
  writeFileSync(join(benchmarkDirectory, 'samples.json'), JSON.stringify(samples));
  writeFileSync(join(directory, 'predictions.csv'), 'id,predicted_answer,error\n');
  return {
    directory: benchmarkDirectory,
    manifest: { benchmark: 'databench', selection, benchmarkHash: hashTree(benchmarkDirectory) },
  };
}

export async function main(argv: string[] = process.argv.slice(2)) {
  const { takeOptions } = require('../../_shared/args.js');
  const { selectSamples }: Benchmark = require('../../databench/index.js');
  const { values: selection, rest } = takeOptions(argv, {
    dataset: { type: 'string' },
    limit: { type: 'string' },
    offset: { type: 'string' },
    suite: { type: 'string' },
  });
  if (rest.includes('--help')) return process.stdout.write(HELP);
  const samples = selectSamples(selection);
  if (!samples.length) throw new Error('No DataBench questions match the selection.');
  const { run } = await import(new URL('../scripts/run.mjs', import.meta.url).href);
  return run('eval', ['databench', ...rest], (directory: string) => prepareSnapshot(directory, samples, selection));
}

function createEvals(directory: string) {
  const benchmark: Benchmark = require(join(directory, 'databench/index.js'));
  const samples: ReturnType<typeof benchmark.selectSamples> = JSON.parse(
    readFileSync(join(directory, 'samples.json'), 'utf8')
  );

  return samples.map((sample) =>
    defineEval({
      description: `${sample.id}: ${sample.question}`,
      tags: ['databench', sample.dataset, sample.suite],
      async test(t) {
        let prediction = '';
        let error = '';
        try {
          const session = await t.session();
          const turn = await session.sendFile(
            `${sample.question}\nAnalyze the attached Parquet file. Return only the ${sample.answerType} answer as a JSON value, without Markdown.`,
            sample.dataPath,
            'application/vnd.apache.parquet'
          );
          t.succeeded();
          t.calledTool('python');
          t.maxToolCalls(30);
          if (process.env.AVA_AGENT_SKILL === 'ava') {
            t.loadedSkill('ava', { status: 'completed' }).gate();
          } else {
            t.notCalledTool('load_skill');
          }
          prediction = benchmark.formatAnswer(JSON.parse(turn.message ?? ''));
          t.check(benchmark.databenchAnswer(prediction, sample), equals(true)).label('answer correctness');
        } catch (cause) {
          error = cause instanceof Error ? cause.message : String(cause);
          throw cause;
        } finally {
          const row = [sample.id, prediction, error].map((value) => `"${value.replace(/"/g, '""')}"`).join(',');
          appendFileSync(join(directory, '../predictions.csv'), `${row}\n`);
        }
      },
    })
  );
}

const directory = process.env.AVA_AGENT_BENCHMARK === 'databench' ? process.env.AVA_AGENT_EVAL_DIR : undefined;
export default directory ? createEvals(directory) : [];

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
