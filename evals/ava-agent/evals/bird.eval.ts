import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { createEvals, readOptions, runEvaluation, saveResults, type Result, type Sample } from './sql.ts';
export { config } from './sql.ts';

const require = createRequire(import.meta.url);

export function writeResult(directory: string, id: string, payload: Result) {
  writeFileSync(join(directory, 'exec_result', `${id}.json`), JSON.stringify(payload));
}

export async function main(argv: string[] = process.argv.slice(2)) {
  const options = readOptions('bird', argv);
  if (!options) return;
  const { values, rest } = options;
  const { ROOT, selectSamples, inspectResources, modelQuestion, databasePath } = require('../../BIRD/index.js');
  const { compare, scoreSamples } = require('../../BIRD/score.js');
  const { integer } = require('../../_shared/args.js');
  const root = resolve(values.root ?? ROOT);
  const timeout = integer(values['score-timeout'], 'score-timeout');
  const selected: { question_id: number; db_id: string; question: string; evidence?: string }[] = selectSamples(values, root);
  inspectResources(selected, root);
  const samples: Sample[] = selected.map((sample) => ({
    id: String(sample.question_id), suite: sample.db_id,
    question: modelQuestion(sample), database: databasePath(sample, root),
  }));
  if (rest.includes('--list')) {
    for (const sample of samples) console.log(`${sample.id} [${sample.suite}] ${sample.question}`);
    return;
  }
  const python = values.python ?? 'python3';
  const runtime = await compare({ action: 'check' }, { python, timeout });
  if (values.check) return console.log(`bird preflight OK: ${samples.length} questions; scorer ready`);
  const directory = await runEvaluation('bird', samples, root, 'dev.json', argv, rest, runtime);
  if (!directory) return;
  // Compare typed result rows against SQLite gold using BIRD's exact row-set rule.
  const report = await scoreSamples({ samples: selected, root,
    predictions: join(directory, 'exec_result'), output: join(directory, 'report.json'), python, timeout });
  saveResults(directory, 'bird', samples, report);
}

const directory = process.env.AVA_AGENT_BENCHMARK === 'bird' ? process.env.AVA_AGENT_EVAL_DIR : undefined;
export default directory ? createEvals(directory, 'bird', writeResult) : [];
