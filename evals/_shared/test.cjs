const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, readFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');
const { createUsage } = require('./usage');
const { OUTPUT_COLUMNS, csvCell } = require('./results');

function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), 'ava-evals-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('usage accumulates multiple calls and preserves incomplete statistics', () => {
  const usage = createUsage();
  assert.equal(usage.value.totalTokens, null);
  usage.add({ inputTokens: 2, outputTokens: 3, totalTokens: 5 });
  usage.add({ inputTokens: 7, outputTokens: 11, totalTokens: 18 });
  assert.deepEqual(usage.value, { inputTokens: 9, outputTokens: 14, totalTokens: 23, calls: 2 });
  usage.add({ inputTokens: 0 });
  usage.add({ inputTokens: 1, outputTokens: 1, totalTokens: 2 });
  assert.deepEqual(usage.value, { inputTokens: 10, outputTokens: null, totalTokens: null, calls: 4 });
});

test('shared evaluator has no implicit benchmark and requires explicit metrics', async () => {
  const { evaluate, getDataset } = require('./index');
  assert.throws(() => getDataset('databench'), /Unknown dataset/);
  await assert.rejects(evaluate({ samples: [], predictions: new Map() }), /metric/);
});

test('CLI custom plugin uses its title and first selected metric', (t) => {
  const directory = temporary(t);
  const plugin = join(directory, 'plugin.cjs');
  writeFileSync(plugin, `module.exports = {
    name: 'custom', title: 'Custom benchmark',
    defaultMetrics: ['exact', 'always'],
    metrics: { always: () => true, exact: (answer, sample) => answer === sample.goldAnswer },
    load: () => [{ id: 'one', suite: 'demo', goldAnswer: 'right' }]
  };`);
  const predictions = join(directory, 'predictions.csv');
  writeFileSync(predictions, 'id,predicted_answer\none,wrong\n');
  const output = join(directory, 'report.json');
  execFileSync(process.execPath, [join(__dirname, '../cli.js'), 'score', '--plugin', plugin,
    '--dataset', 'custom', '--predictions', predictions, '--output', output]);
  const report = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(report.evaluation.benchmark, 'Custom benchmark');
  assert.equal(report.metrics.always.score, 1);
  assert.equal(report.summary.accuracy, 0);
  assert.match(report.provenance.scoringScope, /Summary uses exact/);
});

test('DataBench resumes only compatible configurations and keeps failed rows pending', async (t) => {
  const { prepareOutput } = await import('../ava-workflow/evals/databench.eval.ts');
  const directory = temporary(t);
  const path = join(directory, 'predictions.csv');
  const spec = { dataset: 'databench-lite', model: 'model-a', engine: 'duckdb', strategy: 'loop' };
  assert.equal(prepareOutput(path, spec).size, 0);
  const rows = [['one', 'answer'], ['two', '']];
  appendFileSync(path, rows.map((row) => OUTPUT_COLUMNS.map((_, i) => csvCell(row[i])).join(',')).join('\n') + '\n');
  assert.deepEqual([...prepareOutput(path, spec)], ['one']);
  for (const change of [{ model: 'model-b' }, { engine: 'python' }, { strategy: 'direct' }]) {
    assert.throws(() => prepareOutput(path, { ...spec, ...change }), /configuration changed/);
  }
  const legacy = join(directory, 'legacy.csv');
  writeFileSync(legacy, readFileSync(path));
  assert.throws(() => prepareOutput(legacy, spec), /manifest missing/);
});

test('Agent fixtures use a benchmark-independent directory and reject host paths', async (t) => {
  const { readFixture } = await import('../ava-agent/lib/attachments.mjs');
  const directory = temporary(t);
  mkdirSync(join(directory, 'evals/fixtures'), { recursive: true });
  writeFileSync(join(directory, 'evals/fixtures/0.parquet'), 'fixture');
  assert.equal((await readFixture('ava-fixture:0.parquet', directory)).toString(), 'fixture');
  await assert.rejects(readFixture('ava-fixture:../secret.parquet', directory), /Unsupported/);
  await assert.rejects(readFixture('file:///etc/passwd', directory), /Unsupported/);
  await assert.rejects(readFixture('ava-fixture:0.parquet', undefined), /Unsupported/);
});

test('model config comes only from the env file, ignoring inherited values', (t) => {
  const { readModelEnv } = require('./model-env');
  const path = join(temporary(t), '.env');
  const expected = { OPENAI_MODEL: 'file-model', OPENAI_BASE_URL: 'https://file.example/v1', OPENAI_API_KEY: 'file-key' };
  writeFileSync(path, Object.entries(expected).map(([key, value]) => `${key}="${value}"`).join('\n'));
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  Object.assign(process.env, { OPENAI_MODEL: 'inherited-model', OPENAI_BASE_URL: 'https://inherited.example/v1', OPENAI_API_KEY: 'inherited-key' });
  assert.deepEqual(readModelEnv(path), expected);
  for (const missing of Object.keys(expected)) {
    writeFileSync(path, Object.entries(expected).filter(([key]) => key !== missing).map(([key, value]) => `${key}=${value}`).join('\n'));
    assert.throws(() => readModelEnv(path), new RegExp(`${missing} is required`));
  }
  assert.throws(() => readModelEnv(`${path}.missing`), /ENOENT/);
});
