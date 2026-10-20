const { execFile } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { parseArgs } = require('node:util');
const { ROOT, selectSamples, databasePath, inspectResources } = require('./index');
const { atomicJson, readJson, sha256 } = require('../_shared/files');
const { integer } = require('../_shared/args');

const localPython = join(__dirname, '.venv', 'bin', 'python3');
const PYTHON = existsSync(localPython) ? localPython : 'python3';

function compare(request, { python = PYTHON, timeout = 60_000 } = {}) {
  return new Promise((resolveResult, reject) => {
    const child = execFile(
      python,
      ['-I', join(__dirname, 'compare.py')],
      { timeout, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        let result;
        try {
          result = JSON.parse(stdout);
        } catch {
          /* Process diagnostic below. */
        }
        if (error || result?.error || !result)
          reject(
            new Error(
              error?.killed
                ? `Scoring timed out after ${timeout}ms`
                : result?.error || stderr || error?.message || 'No scoring result'
            )
          );
        else resolveResult(result);
      }
    );
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(request));
  });
}

async function scoreSamples({ samples, root = ROOT, predictions, output, python, timeout = 60_000 }) {
  const items = [];
  for (const sample of samples) {
    const prediction = join(predictions, `${sample.question_id}.json`);
    let item = { question_id: sample.question_id, db_id: sample.db_id, difficulty: sample.difficulty, score: 0 };
    if (!existsSync(prediction)) item.status = 'missing';
    else {
      try {
        const result = await compare(
          { prediction, database: databasePath(sample, root), sql: sample.SQL },
          { python, timeout }
        );
        item = {
          ...item,
          ...result,
          status: result.score === 1 ? 'passed' : 'incorrect',
          prediction_sha256: sha256(prediction),
        };
      } catch (error) {
        item = { ...item, status: 'error', error: error.message };
      }
    }
    items.push(item);
  }
  const summarize = (rows) => ({
    total: rows.length,
    passed: rows.filter((r) => r.score === 1).length,
    accuracy: rows.length ? rows.reduce((n, r) => n + r.score, 0) / rows.length : null,
  });
  const report = {
    benchmark: 'bird',
    mode: 'ava-result-vs-sqlite-gold',
    comparator: 'exact-row-set',
    evaluatedAt: new Date().toISOString(),
    ...summarize(items),
    missing: items.filter((r) => r.status === 'missing').length,
    errors: items.filter((r) => r.status === 'error').length,
    difficulties: Object.fromEntries(
      ['simple', 'moderate', 'challenging'].map((d) => [d, summarize(items.filter((r) => r.difficulty === d))])
    ),
    databases: Object.fromEntries(
      [...new Set(items.map((r) => r.db_id))].map((db) => [db, summarize(items.filter((r) => r.db_id === db))])
    ),
    items,
  };
  atomicJson(output, report);
  process.stdout.write(
    `BIRD result accuracy: ${report.passed}/${report.total} (${(report.accuracy * 100).toFixed(2)}%), missing ${
      report.missing
    }, errors ${report.errors}\nReport: ${output}\n`
  );
  return report;
}

async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      dataset: { type: 'string' },
      predictions: { type: 'string' },
      output: { type: 'string' },
      root: { type: 'string', default: ROOT },
      python: { type: 'string', default: PYTHON },
      timeout: { type: 'string', default: '60000' },
      help: { type: 'boolean' },
    },
  });
  if (values.help)
    return process.stdout.write(
      'Usage: node evals/cli.js score --dataset bird --predictions <run-directory> [--root <datasets/dev>] [--python <path>] [--timeout <ms>] [--output <report.json>]\n'
    );
  if (!values.predictions) throw new Error('--predictions is required');
  const input = resolve(values.predictions);
  const manifest = readJson(join(input, 'manifest.json'));
  if (manifest.benchmark !== 'bird' || !Array.isArray(manifest.ids) || !manifest.ids.length)
    throw new Error('Invalid BIRD manifest.');
  const samples = selectSamples({ id: manifest.ids, limit: 'all' }, values.root);
  inspectResources(samples, values.root);
  for (const [file, hash] of Object.entries(manifest.resources)) {
    if (file.startsWith('semantic:')) {
      const saved = readJson(join(input, 'semantic.json'))[file.slice('semantic:'.length)];
      if (!saved?.config) throw new Error(`BIRD semantic snapshot missing: ${file}`);
      const actual = saved?.source
        ? sha256(saved.source)
        : createHash('sha256').update(JSON.stringify(saved?.config)).digest('hex');
      if (saved?.sha256 !== hash || actual !== hash) throw new Error(`BIRD semantic resource changed: ${file}`);
    } else if (sha256(join(values.root, file)) !== hash) throw new Error(`BIRD resource changed: ${file}`);
  }
  const report = await scoreSamples({
    samples,
    root: values.root,
    predictions: join(input, 'exec_result'),
    output: values.output ?? join(input, 'report.json'),
    python: values.python,
    timeout: integer(values.timeout, 'timeout'),
  });
  if (report.missing || report.errors) process.exitCode = 1;
  return report;
}

module.exports = { PYTHON, main, compare, scoreSamples };
