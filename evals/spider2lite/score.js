const { execFile } = require('node:child_process');
const { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const { parseArgs } = require('node:util');
const { ROOT, integer, inspectResources, loadQuestions, readJson, selectSamples, sha256 } = require('./index');

function pythonPath() {
  const venv = join(ROOT, '.venv/bin/python');
  return existsSync(venv) ? venv : 'python3';
}

function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
  renameSync(temp, path);
}

function official(request, { python = pythonPath(), timeout = 60_000 } = {}) {
  return new Promise((resolveResult, reject) => {
    const child = execFile(
      python,
      ['-I', join(ROOT, 'official.py')],
      {
        timeout,
        killSignal: 'SIGKILL',
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        let result;
        try {
          result = JSON.parse(stdout);
        } catch {
          /* Include the process diagnostic below. */
        }
        if (error || result?.bridge_error || !result) {
          reject(
            new Error(
              error?.killed
                ? `Official scoring timed out after ${timeout}ms`
                : result?.bridge_error || stderr || error?.message || 'No scoring result'
            )
          );
        } else resolveResult(result);
      }
    );
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(request));
  });
}

async function checkScorer(root = ROOT, options) {
  return official({ root: resolve(root), action: 'check' }, options);
}

async function scoreSamples({
  samples,
  predictions,
  output,
  root = ROOT,
  mode = 'sql',
  python,
  timeout = 60_000,
  concurrency = 1,
  runtime,
}) {
  predictions = resolve(predictions);
  output = resolve(output);
  const results = join(dirname(output), 'exec_result');
  if (mode === 'sql') mkdirSync(results, { recursive: true });
  const items = new Array(samples.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, samples.length) }, async () => {
      while (cursor < samples.length) {
        const i = cursor++;
        const sample = samples[i];
        const id = sample.instance_id;
        const path = join(predictions, `${id}.${mode === 'sql' ? 'sql' : 'csv'}`);
        const resultPath = join(results, `${id}.csv`);
        if (mode === 'sql' && existsSync(resultPath)) unlinkSync(resultPath);
        if (!existsSync(path) || !readFileSync(path, 'utf8').trim()) {
          items[i] = { instance_id: id, score: 0, status: 'missing', error_info: 'No prediction' };
          continue;
        }
        try {
          const result = await official(
            { root: resolve(root), action: 'score', mode, sample, predictions, results },
            { python, timeout }
          );
          items[i] = {
            ...result,
            prediction_sha256: sha256(path),
            status: result.score === 1 ? 'passed' : result.error_info === 'Result Error' ? 'incorrect' : 'error',
          };
        } catch (error) {
          items[i] = {
            instance_id: id,
            score: 0,
            status: 'error',
            error_info: error.message,
            prediction_sha256: sha256(path),
          };
        }
      }
    })
  );
  const passed = items.filter((r) => r.score === 1).length;
  const missing = items.filter((r) => r.status === 'missing').length;
  const all = loadQuestions(root);
  const report = {
    benchmark: 'spider2lite',
    scope: 'SQLite subset',
    mode,
    evaluatedAt: new Date().toISOString(),
    total: samples.length,
    predicted: samples.length - missing,
    missing,
    passed,
    errors: items.filter((r) => r.status === 'error').length,
    accuracy: passed / samples.length,
    submittedAccuracy: samples.length === missing ? null : passed / (samples.length - missing),
    coverage: (samples.length - missing) / samples.length,
    datasetTotal: all.length,
    sqliteTotal: all.filter((r) => r.instance_id.startsWith('local')).length,
    runtime,
    limits: { timeoutMs: timeout, concurrency },
    items,
  };
  atomicJson(output, report);
  process.stdout.write(
    `SQLite subset: ${passed}/${samples.length} (${(100 * report.accuracy).toFixed(2)}%), missing ${missing}, errors ${
      report.errors
    }\nReport: ${output}\n`
  );
  return report;
}

const HELP = `Usage: node evals/cli.js score --dataset spider2lite --predictions <run-dir|sql-dir|csv-dir> [options]
  --mode <sql|exec_result>  Native SQLite execution or official CSV comparison (default sql)
  --limit <number|all>     Default all SQLite questions; run manifest selects its exact IDs
  --offset <number>        Offset after filters (default 0)
  --suite <database>       Filter a SQLite database
  --id <instance_id>       Repeatable SQLite question filter
  --root <path>            Dataset directory (default evals/spider2lite)
  --python <path>          Python with pandas, google-cloud-bigquery, tqdm
  --timeout <ms>           Per-question external scoring deadline (default 60000)
  --concurrency <number>   Parallel scoring processes (default 1)
  --output <path>          JSON report (default <predictions>/report.json)
  --help                  No data, Python or model required
`;

async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      dataset: { type: 'string' },
      predictions: { type: 'string' },
      output: { type: 'string' },
      mode: { type: 'string', default: 'sql' },
      root: { type: 'string', default: ROOT },
      python: { type: 'string' },
      timeout: { type: 'string', default: '60000' },
      concurrency: { type: 'string', default: '1' },
      limit: { type: 'string' },
      offset: { type: 'string' },
      id: { type: 'string', multiple: true },
      suite: { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) return process.stdout.write(HELP);
  if (!values.predictions) throw new Error('--predictions is required');
  if (!['sql', 'exec_result'].includes(values.mode)) throw new Error('--mode must be sql or exec_result');
  const timeout = integer(values.timeout, 'timeout');
  const concurrency = integer(values.concurrency, 'concurrency');
  const input = resolve(values.predictions);
  const manifest = existsSync(join(input, 'manifest.json')) ? readJson(join(input, 'manifest.json')) : null;
  if (manifest && (!Array.isArray(manifest.ids) || !manifest.ids.length || manifest.benchmark !== 'spider2lite'))
    throw new Error('Invalid Spider2-Lite run manifest');
  if (manifest && (values.limit || values.offset || values.id || values.suite))
    throw new Error(
      'Run manifest fixes question selection; do not combine with filters. Use a raw prediction directory for a new selection.'
    );
  const samples = selectSamples(
    manifest ? { id: manifest.ids, limit: 'all' } : { ...values, limit: values.limit ?? 'all' },
    values.root
  );
  inspectResources(samples, values.root, { databases: values.mode === 'sql' });
  const runtime = await checkScorer(values.root, { python: values.python, timeout });
  const report = await scoreSamples({
    samples,
    predictions: manifest ? join(input, values.mode === 'sql' ? 'sql' : 'exec_result') : input,
    output: values.output ?? join(input, 'report.json'),
    root: values.root,
    mode: values.mode,
    python: values.python,
    timeout,
    concurrency,
    runtime,
  });
  if (report.missing || report.errors) process.exitCode = 1;
  return report;
}

module.exports = { main, official, checkScorer, scoreSamples, atomicJson, pythonPath };
