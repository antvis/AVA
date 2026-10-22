import { appendFileSync, copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineEval, defineEvalConfig, type EveEvalSession } from 'eve/evals';
import { equals } from 'eve/evals/expect';
import { z } from 'zod';
import { removeSessionContainers } from '../lib/cleanup.mjs';
import { readSessionResult } from '../lib/sql-results.mjs';

const evalsRoot = fileURLToPath(new URL('../../', import.meta.url));
type Benchmark = 'bird' | 'spider2lite';
export type Sample = { id: string; suite: string; question: string; database: string };
export const config = defineEvalConfig({ maxConcurrency: 1, timeoutMs: 600000 });

export async function prepareSnapshot(directory: string, benchmark: Benchmark, samples: Sample[]) {
  const { atomicJson } = await import(new URL('../../_shared/files.js', import.meta.url).href);
  const { OUTPUT_COLUMNS } = await import(new URL('../../_shared/results.js', import.meta.url).href);
  mkdirSync(join(directory, 'evals/fixtures'), { recursive: true });
  mkdirSync(join(directory, 'benchmarks/_shared'), { recursive: true });
  writeFileSync(join(directory, 'benchmarks/package.json'), '{"type":"module"}\n');
  copyFileSync(join(evalsRoot, '_shared/results.js'), join(directory, 'benchmarks/_shared/results.js'));
  writeFileSync(join(directory, 'evals/evals.config.ts'), `export { config as default } from './${benchmark}.eval.ts';\n`);
  const files = new Map<string, string>();
  const selected = samples.map((sample) => {
    let file = files.get(sample.database);
    if (!file) {
      file = `${files.size}.sqlite`;
      copyFileSync(sample.database, join(directory, 'evals/fixtures', file));
      files.set(sample.database, file);
    }
    return { ...sample, database: file };
  });
  atomicJson(join(directory, 'benchmarks/samples.json'), selected);
  for (const folder of ['exec_result', 'sql', 'records']) mkdirSync(join(directory, folder));
  writeFileSync(join(directory, 'predictions.csv'), OUTPUT_COLUMNS.join(',') + '\n');
  return { directory: join(directory, 'benchmarks'), manifest: { benchmark } };
}

export async function readOptions(benchmark: Benchmark, argv: string[]) {
  const { takeOptions } = await import(new URL('../../_shared/args.js', import.meta.url).href);
  const { values, rest } = takeOptions(argv, {
    root: { type: 'string' }, limit: { type: 'string' }, offset: { type: 'string' },
    suite: { type: 'string' }, id: { type: 'string', multiple: true },
    python: { type: 'string' }, 'score-timeout': { type: 'string', default: '60000' },
    'max-context-bytes': { type: 'string', default: '4194304' }, check: { type: 'boolean' },
  });
  if (rest.includes('--help')) {
    process.stdout.write(`Usage: node evals/cli.js run ava-agent --benchmark ${benchmark} [options]
  --root <path>             Dataset root (same default as AVA Workflow)
  --limit <number|all>      Default 20
  --offset <number>         Default 0, after filtering
  --suite <database>        Filter database
  --id <question-id>        Repeatable question ID (Spider2-Lite: SQLite only)
  --skill <ava|none>        Default ava
  --list                   List selected questions without model calls
  --check                  Check resources and scorer without model calls
  --python <path>           Scoring Python interpreter
  --score-timeout <ms>      Default 60000
  --max-context-bytes <n>   Spider2-Lite reference limit, default 4194304
Additional execution options are forwarded to Eve. Results: results/${benchmark}-<run-id>/.
`);
    return;
  }
  return { values, rest };
}

export async function runEvaluation(benchmark: Benchmark, samples: Sample[], root: string,
  questionFile: string, argv: string[], rest: string[], runtime: unknown) {
  const { atomicJson, sha256 } = await import(new URL('../../_shared/files.js', import.meta.url).href);
  const resources = Object.fromEntries([...new Set([
    join(root, questionFile),
    ...samples.map((sample) => sample.database),
  ])].map((file) => [relative(root, file), sha256(file)]));
  const { run } = await import(new URL('../scripts/run.mjs', import.meta.url).href);
  const result = await run('eval', [benchmark, ...rest], async (directory: string) => {
    const snapshot = await prepareSnapshot(directory, benchmark, samples);
    atomicJson(join(directory, 'manifest.json'), {
      benchmark, ids: samples.map((sample) => sample.id), resources, runtime,
      model: process.env.OPENAI_MODEL, arguments: argv, mode: 'agent-exec-result',
    });
    return snapshot;
  });
  if (result.signal) return;
  for (const [file, hash] of Object.entries(resources)) {
    if (sha256(join(root, file)) !== hash) throw new Error(`Benchmark resource changed: ${file}`);
  }
  return result.directory;
}

export function saveResults(directory: string, benchmark: Benchmark, samples: Sample[],
  report: { missing: number; errors: number }) {
  const complete = samples.every((sample) => {
    try { return JSON.parse(readFileSync(join(directory, 'records', `${sample.id}.json`), 'utf8')).id === sample.id; }
    catch { return false; }
  });
  if (complete) {
    const output = join(evalsRoot, 'ava-agent/results', `${benchmark}-${basename(directory)}`);
    mkdirSync(output, { recursive: true });
    for (const entry of ['manifest.json', 'run.json', 'predictions.csv', 'report.json', 'exec_result', 'sql', 'records']) {
      cpSync(join(directory, entry), join(output, entry), { recursive: true });
    }
    console.error(`Results: ${output}`);
  } else console.error(`Incomplete run; partial results remain at ${directory}`);
  if (report.missing || report.errors) process.exitCode = 1;
}

export type Result = { schema: { name: string; type: string }[]; rows: (string | number | boolean | null)[][] };

export async function createEvals(directory: string, benchmark: Benchmark,
  writeResult: (directory: string, id: string, payload: Result) => void | Promise<void>) {
  const { csvCell } = await import(pathToFileURL(join(directory, '_shared/results.js')).href);
  const runDirectory = resolve(directory, '..');
  const samples: Sample[] = JSON.parse(readFileSync(join(directory, 'samples.json'), 'utf8'));
  return samples.map((sample) => defineEval({
    description: `${sample.id}: ${sample.question}`, tags: [benchmark, sample.suite],
    async test(t) {
      const started = Date.now();
      let session: EveEvalSession | undefined;
      let sql = '';
      let error = '';
      try {
        session = await t.session();
        const outputSchema = z.object({ sql: z.string().min(1) });
        const turn = await session.send([{ type: 'text', text: `${sample.question}
Analyze the attached SQLite database.
Execute the query and save the COMPLETE result to /workspace/output/result.json as JSON:
{"schema":[{"name":"column_name","type":"INTEGER"}],"rows":[[1]],"truncated":false}.
Use one schema entry per column in query order with its SQL type; preserve scalar types and nulls.
Save all rows, not a preview. If the result exceeds 10000 rows or 64 MiB, report failure; never silently truncate.
Return the SQL actually executed in the required structured output.`,
        }, {
          type: 'file',
          data: new URL(`ava-fixture:${basename(sample.database)}`),
          filename: basename(sample.database),
          mediaType: 'application/vnd.sqlite3',
        }], { outputSchema });
        turn.expectOk();
        if (turn.data === undefined) throw new Error(`Agent turn ended without a result: ${turn.status}`);
        sql = outputSchema.parse(turn.data).sql;
        writeFileSync(join(runDirectory, 'sql', `${sample.id}.sql`), sql + '\n');
        const payload = await readSessionResult(session.sessionId);
        await writeResult(runDirectory, sample.id, payload);
        t.succeeded();
        t.check(turn.toolCalls.some((call) => call.name === 'python' || call.name === 'bash'), equals(true)).label('execution tool called');
        t.maxToolCalls(30);
        if (process.env.AVA_AGENT_SKILL === 'ava') t.loadedSkill('ava', { status: 'completed' }).gate();
        else t.notCalledTool('load_skill');
      } catch (cause) {
        error = cause instanceof Error ? cause.message : String(cause);
        throw cause;
      } finally {
        const usage = session?.events.flatMap((event) => event.type === 'step.completed' ? [event.data.usage] : []) ?? [];
        const input = usage.length && usage.every((item) => item?.inputTokens != null)
          ? usage.reduce((sum, item) => sum + item!.inputTokens!, 0) : '';
        const output = usage.length && usage.every((item) => item?.outputTokens != null)
          ? usage.reduce((sum, item) => sum + item!.outputTokens!, 0) : '';
        try {
          writeFileSync(join(runDirectory, 'records', `${sample.id}.json`), JSON.stringify({ id: sample.id, error, sessionId: session?.sessionId }));
          appendFileSync(join(runDirectory, 'predictions.csv'),
            [sample.id, '', sql, error, process.env.OPENAI_MODEL, Date.now() - started, input, output,
              input !== '' && output !== '' ? input + output : ''].map(csvCell).join(',') + '\n');
        } finally {
          if (session) await removeSessionContainers(session.sessionId).catch((cause) => console.error(`Sandbox cleanup failed: ${cause.message}`));
        }
      }
    },
  }));
}
