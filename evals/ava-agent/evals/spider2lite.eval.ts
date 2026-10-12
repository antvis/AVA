import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { createEvals, readOptions, runEvaluation, saveResults, type Result, type Sample } from './sql.ts';
export { config } from './sql.ts';

const require = createRequire(import.meta.url);

export function writeResult(directory: string, id: string, payload: Result) {
  const { csvCell } = require(join(directory, 'benchmarks/_shared/results.js'));
  writeFileSync(join(directory, 'exec_result', `${id}.csv`),
    [payload.schema.map((column) => column.name), ...payload.rows]
      .map((row) => row.map(csvCell).join(',')).join('\n') + '\n');
}

export async function main(argv: string[] = process.argv.slice(2)) {
  const options = readOptions('spider2lite', argv);
  if (!options) return;
  const { values, rest } = options;
  const { ROOT, selectSamples, inspectResources, modelQuestion } = require('../../spider2lite/index.js');
  const { checkScorer, scoreSamples, pythonPath } = require('../../spider2lite/score.js');
  const { integer } = require('../../_shared/args.js');
  const root = resolve(values.root ?? ROOT);
  const timeout = integer(values['score-timeout'], 'score-timeout');
  const maxContextBytes = integer(values['max-context-bytes'], 'max-context-bytes');
  const selected: { instance_id: string; db: string; question: string; external_knowledge?: string }[] = selectSamples(values, root);
  inspectResources(selected, root, { maxContextBytes });
  const samples: Sample[] = selected.map((sample) => ({
    id: sample.instance_id, suite: sample.db,
    question: modelQuestion(sample, root, maxContextBytes),
    database: join(root, 'resource/databases/spider2-localdb', `${sample.db}.sqlite`),
  }));
  if (rest.includes('--list')) {
    for (const sample of samples) console.log(`${sample.id} [${sample.suite}] ${sample.question}`);
    return;
  }
  const python = values.python ?? pythonPath();
  const runtime = await checkScorer(root, { python, timeout });
  if (values.check) return console.log(`spider2lite preflight OK: ${samples.length} questions; scorer ready`);
  const directory = await runEvaluation('spider2lite', samples, root, 'spider2-lite.jsonl', argv, rest, runtime);
  if (!directory) return;
  // The official scorer compares CSV results using each instance's gold metadata.
  const report = await scoreSamples({ samples: selected, root,
    predictions: join(directory, 'exec_result'), output: join(directory, 'report.json'), python, timeout, runtime });
  saveResults(directory, 'spider2lite', samples, report);
}

const directory = process.env.AVA_AGENT_BENCHMARK === 'spider2lite' ? process.env.AVA_AGENT_EVAL_DIR : undefined;
export default directory ? createEvals(directory, 'spider2lite', writeResult) : [];
