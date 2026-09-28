import { appendFileSync, copyFileSync, constants, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { defineEval, defineEvalConfig, type EveEvalSession } from 'eve/evals';
import { equals } from 'eve/evals/expect';
import { createTextWithFileContent } from 'eve/client';
import { z } from 'zod';

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
  cpSync(join(evalsRoot, '_shared/results.js'), join(benchmarkDirectory, '_shared/results.js'));
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
  const { OUTPUT_COLUMNS, csvCell } = require('../../_shared/results.js');
  writeFileSync(join(directory, 'predictions.csv'), `${OUTPUT_COLUMNS.map(csvCell).join(',')}\n`);
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
  const result = await run('eval', ['databench', ...rest], (directory: string) => prepareSnapshot(directory, samples, selection));
  if (!rest.includes('--list') && !result.signal) {
    saveResults(result.directory, samples, join(evalsRoot, 'ava-agent/results'));
  }
}

export function saveResults(directory: string, samples: ReturnType<Benchmark['selectSamples']>, destination: string) {
  const { readCsv } = require('../../_shared/datasets.js');
  const source = join(directory, 'predictions.csv');
  const rows = readCsv(source);
  const ids = new Set(rows.map((row: { id: string }) => row.id));
  if (rows.length !== samples.length || !samples.every((sample) => ids.has(sample.id))) {
    console.error(`Incomplete run; partial predictions remain at ${source}`);
    return;
  }
  mkdirSync(destination, { recursive: true });
  const output = join(destination, `${samples[0].dataset}-${basename(directory)}.csv`);
  copyFileSync(source, output, constants.COPYFILE_EXCL);
  console.error(`Results: ${output}`);
  return output;
}

const answerTypes: Record<string, z.ZodType> = {
  boolean: z.boolean(),
  number: z.number(),
  category: z.string(),
  'list[category]': z.array(z.string()),
  'list[number]': z.array(z.number()),
};

export function createEvals(directory: string) {
  const { csvCell } = require(join(directory, '_shared/results.js'));
  const benchmark: Benchmark = require(join(directory, 'databench/index.js'));
  const samples: ReturnType<typeof benchmark.selectSamples> = JSON.parse(
    readFileSync(join(directory, 'samples.json'), 'utf8')
  );

  return samples.map((sample) =>
    defineEval({
      description: `${sample.id}: ${sample.question}`,
      tags: ['databench', sample.dataset, sample.suite],
      async test(t) {
        const startedAt = Date.now();
        let prediction = '';
        let sql = '';
        let error = '';
        let session: EveEvalSession | undefined;
        try {
          const answerType = answerTypes[sample.answerType];
          if (!answerType) throw new Error(`Unsupported DataBench answer type: ${sample.answerType}`);
          const outputSchema = z.object({ answer: answerType.nullable(), sql: z.string() });
          session = await t.session();
          const turn = await session.send(
            createTextWithFileContent({
              text: `${sample.question}\nAnalyze the attached Parquet file. Return the ${sample.answerType} answer in the required structured output. Include the SQL actually executed to derive the answer in sql; use an empty string if no SQL was used.`,
              bytes: readFileSync(sample.dataPath),
              filename: basename(sample.dataPath),
              mediaType: 'application/vnd.apache.parquet',
            }),
            { outputSchema }
          );
          t.succeeded();
          t.calledTool('python');
          t.maxToolCalls(30);
          if (process.env.AVA_AGENT_SKILL === 'ava') {
            t.loadedSkill('ava', { status: 'completed' }).gate();
          } else {
            t.notCalledTool('load_skill');
          }
          const result = outputSchema.parse(turn.data);
          sql = result.sql;
          prediction = benchmark.formatAnswer(result.answer);
          t.check(benchmark.databenchAnswer(prediction, sample), equals(true)).label('answer correctness');
        } catch (cause) {
          error = cause instanceof Error ? cause.message : String(cause);
          throw cause;
        } finally {
          const usage = session?.events.flatMap((event) => event.type === 'step.completed' ? [event.data.usage] : []) ?? [];
          const inputTokens = usage.length > 0 && usage.every((item) => item?.inputTokens != null)
            ? usage.reduce((sum, item) => sum + item!.inputTokens!, 0) : '';
          const outputTokens = usage.length > 0 && usage.every((item) => item?.outputTokens != null)
            ? usage.reduce((sum, item) => sum + item!.outputTokens!, 0) : '';
          const totalTokens = inputTokens !== '' && outputTokens !== '' ? inputTokens + outputTokens : '';
          const row = [sample.id, prediction, sql, error, process.env.OPENAI_MODEL,
            Date.now() - startedAt, inputTokens, outputTokens, totalTokens].map(csvCell).join(',');
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
