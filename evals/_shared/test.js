import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, appendFileSync, readFileSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { OUTPUT_COLUMNS, csvCell, csvRows, previewCsv, readCsv } from './results.js';
import { atomicJson, atomicWrite } from './files.js';
import { forEachConcurrent } from './concurrency.js';
import { buildReport } from './report.js';
import { selectSamples, plugins } from '../databench/index.js';
import { getDataset, loadPlugin } from './index.js';

function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), 'ava-evals-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('concurrent iteration visits every item once within the worker limit', async () => {
  const items = Array.from({ length: 7 }, (_, i) => i);
  const visited = [];
  let active = 0;
  let peak = 0;
  await forEachConcurrent(items, 3, async (item, index) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setImmediate(resolve));
    visited.push([item, index]);
    active--;
  });
  assert.equal(peak, 3);
  assert.equal(active, 0);
  assert.deepEqual(visited.sort(([a], [b]) => a - b), items.map((item) => [item, item]));
  await forEachConcurrent([], 3, () => assert.fail('Empty selections must not start work'));
  const serial = [];
  await forEachConcurrent(items, 1, async (item) => { serial.push(item); });
  assert.deepEqual(serial, items);
});

test('concurrent iteration waits for surviving workers before rejecting', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const failure = new Error('Worker failed');
  const visited = [];
  let settled = false;
  const run = forEachConcurrent([0, 1, 2], 2, async (item) => {
    if (item === 0) throw failure;
    if (item === 1) await gate;
    visited.push(item);
  });
  const rejected = assert.rejects(run, (error) => error === failure).then(() => { settled = true; });
  try {
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(settled, false);
  } finally {
    release();
  }
  await rejected;
  assert.deepEqual(visited, [1, 2]);
});

test('raw preview CSV preserves schema order, quoting and JSON cells', () => {
  const schema = ['text', 'number', 'flag', 'empty', 'object'].map((name) => ({ name }));
  assert.equal(previewCsv({ schema, data: [] }), '"text","number","flag","empty","object"');
  assert.equal(previewCsv({ schema, data: [{ object: { a: [1] }, empty: null, flag: false,
    number: 0, text: 'a,"b"\nc' }] }),
    '"text","number","flag","empty","object"\n"a,""b""\nc","0","false","","{""a"":[1]}"');
});

test('result CSV preserves scalar cells and round-trips quoted text', (t) => {
  const file = join(temporary(t), 'result.csv');
  const rows = [['text', 'number', 'flag', 'empty'], ['a,"b"\nc', 0, false, null]];
  assert.equal(csvRows([]), '');
  assert.equal(csvRows(rows), '"text","number","flag","empty"\n"a,""b""\nc","0","false",""');
  atomicWrite(file, csvRows(rows) + '\n');
  assert.deepEqual(readCsv(file), [{ text: 'a,"b"\nc', number: '0', flag: 'false', empty: '' }]);
});

test('atomic writes replace complete files and retain the destination when writing fails', (t) => {
  const directory = join(temporary(t), 'nested');
  const file = join(directory, 'result.sql');
  atomicWrite(file, 'SELECT 1;\n');
  atomicWrite(file, 'SELECT 2;\n');
  assert.equal(readFileSync(file, 'utf8'), 'SELECT 2;\n');
  assert.throws(() => atomicWrite(file, Symbol('invalid content')), TypeError);
  assert.equal(readFileSync(file, 'utf8'), 'SELECT 2;\n');
  const manifest = join(directory, 'manifest.json');
  atomicJson(manifest, { status: 'success' });
  assert.equal(readFileSync(manifest, 'utf8'), '{\n  "status": "success"\n}\n');
  assert.deepEqual(readdirSync(directory).sort(), ['manifest.json', 'result.sql']);
});

test('workflow strategy parsing preserves retry defaults and validates only the selected budget', async () => {
  const { readStrategy } = await import('../ava-workflow/workflow.ts');
  const values = { strategy: 'direct', 'max-retries': '2', 'max-steps': '12' };
  assert.deepEqual(readStrategy(values), { type: 'direct', maxRetries: 2 });
  assert.deepEqual(readStrategy({ ...values, 'max-retries': '0', 'max-steps': 'unused' }), { type: 'direct', maxRetries: 0 });
  assert.deepEqual(readStrategy({ ...values, strategy: 'loop', 'max-retries': 'unused' }), { type: 'loop', maxSteps: 12 });
  assert.throws(() => readStrategy({ ...values, strategy: 'subset' }), /--strategy must be direct or loop/);
  for (const retry of ['-1', '1.5', 'invalid']) {
    assert.throws(() => readStrategy({ ...values, 'max-retries': retry }), /--max-retries/);
  }
  assert.throws(() => readStrategy({ ...values, strategy: 'loop', 'max-steps': '0' }), /--max-steps/);
  assert.throws(() => readStrategy({ ...values, strategy: 'unknown' }), /--strategy/);
});

test('model metadata omits endpoint credentials and supports both model representations', async () => {
  const { modelMetadata } = await import('../ava-workflow/model.ts');
  const config = { model: 'demo', baseURL: 'https://user:secret@example.com/v1?api_key=secret' };
  assert.deepEqual(modelMetadata(config), { model: 'demo', endpoint: 'https://example.com/v1' });
  assert.deepEqual(modelMetadata({ ...config, model: { modelId: 'provider-model' } }),
    { model: 'provider-model', endpoint: 'https://example.com/v1' });
  assert.equal(config.baseURL, 'https://user:secret@example.com/v1?api_key=secret');
});

test('CLI report stores aggregate scores once and preserves all selected metrics', (t) => {
  const directory = temporary(t);
  const plugin = join(directory, 'plugin.mjs');
  writeFileSync(plugin, `export default {
    name: 'custom', title: 'Custom benchmark',
    defaultMetrics: ['exact', 'always'],
    metrics: { always: () => true, exact: (answer, sample) => answer === sample.goldAnswer },
    load: () => [{ id: 'one', suite: 'demo', goldAnswer: 'right' },
      { id: 'two', suite: 'demo', goldAnswer: 'missing' }]
  };`);
  const predictions = join(directory, 'predictions.csv');
  writeFileSync(predictions, 'id,predicted_answer,error\none,wrong,\ntwo,,execution failed\n');
  const metadata = join(directory, 'metadata.json');
  writeFileSync(metadata, JSON.stringify({ environment: { nodeVersion: 'unused' }, evaluation: { schema: false, profile: false, semantic: false,
    context: { type: 'raw', previewRows: 3, schema: false, profile: true, semantic: false },
    predictionsSha256: 'private-hash' }, provenance: { semanticSha256: { demo: 'private-hash' },
      source: { report_sha256: 'private-hash', scope: 'fixture' },
      execution: 'Historical answers plus targeted reruns.', calibration: 'Reference-assisted; no held-out evaluation.',
      statistics: 'Mixed historical and fresh row costs.', limitations: ['Not a fresh full run.'],
      verification: { checks: 100 }, artifactRetention: 'Local audit only.' } }));
  const output = join(directory, 'report.json');
  const stdout = execFileSync(process.execPath, [join(import.meta.dirname, '../cli.js'), 'score', '--plugin', plugin,
    '--dataset', 'custom', '--predictions', predictions, '--metadata', metadata, '--output', output]);
  const report = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(report.evaluation.benchmark, 'Custom benchmark');
  assert.deepEqual(report.evaluation.context, { type: 'raw', previewRows: 3, profile: true });
  const expected = { total: 2, predicted: 1, missing: 1,
    metrics: { exact: { passed: 0, score: 0 }, always: { passed: 1, score: 0.5 } } };
  assert.deepEqual(report.summary, { ...expected,
    timingSeconds: { average: null, minimum: null, maximum: null, median: null },
    tokens: { prompt: null, completion: null, total: null, average: null } });
  for (const key of ['total', 'predicted', 'missing', 'metrics', 'errors', 'failures', 'suites', 'environment']) {
    assert.equal(Object.hasOwn(report, key), false);
  }
  assert.match(stdout.toString(), /always: 50\.00% \(1\/2\)/);
  assert.doesNotMatch(JSON.stringify(report), /sha256|private-hash/i);
  assert.deepEqual(report.provenance, {
    execution: 'Historical answers plus targeted reruns.', calibration: 'Reference-assisted; no held-out evaluation.',
    limitations: ['Not a fresh full run.'], statistics: 'Mixed historical and fresh row costs.',
  });
  const defaults = buildReport(expected, [], { predictions: [] });
  assert.deepEqual(Object.keys(defaults.provenance), ['statistics']);
  assert.match(defaults.provenance.statistics, /recorded values only.*retry overhead/);
  writeFileSync(metadata, JSON.stringify({ sha256: 'unsupported-metadata' }));
  assert.throws(() => buildReport({}, [], { metadata }), /supports only/);
});

test('plugin imports support ESM and existing CommonJS exports', async (t) => {
  const directory = temporary(t);
  for (const [name, source, extension] of [
    ['esm-named', "export const name = 'esm-named'; export const load = () => [];", 'mjs'],
    ['esm-array', "export default [{ name: 'esm-array', load: () => [] }];", 'mjs'],
    ['cjs-legacy', "module.exports = { name: 'cjs-legacy', load: () => [] };", 'cjs'],
  ]) {
    const file = join(directory, `plugin ${name}.${extension}`);
    writeFileSync(file, source);
    const loaded = await loadPlugin(file);
    assert.equal(loaded.length, 1);
    assert.equal(getDataset(name).load().length, 0);
  }
});

test('DataBench resumes only compatible configurations and keeps failed rows pending', async (t) => {
  const { prepareOutput } = await import('../ava-workflow/evals/databench.eval.ts');
  const directory = temporary(t);
  const path = join(directory, 'predictions.csv');
  const spec = { dataset: 'databench-lite', model: 'model-a', engine: 'duckdb', strategy: 'loop', semantic: { demo: 'hash-a' }, data: { demo: 'data-hash-a' } };
  assert.equal(prepareOutput(path, spec).size, 0);
  const rows = [['one', 'answer'], ['two', '']];
  appendFileSync(path, rows.map((row) => OUTPUT_COLUMNS.map((_, i) => csvCell(row[i])).join(',')).join('\n') + '\n');
  assert.deepEqual([...prepareOutput(path, spec)], ['one']);
  for (const change of [{ model: 'model-b' }, { engine: 'python' }, { strategy: 'direct' }, { semantic: { demo: 'hash-b' } }, { semantic: undefined }, { data: { demo: 'data-hash-b' } }, { context: { type: 'raw', previewRows: 3 } }, { sampleIds: ['one'] }]) {
    assert.throws(() => prepareOutput(path, { ...spec, ...change }), /configuration changed/);
  }
  const legacy = join(directory, 'legacy.csv');
  writeFileSync(legacy, readFileSync(path));
  assert.throws(() => prepareOutput(legacy, spec), /manifest missing/);
});

test('DataBench selects explicit error IDs and rejects incomplete or ambiguous scopes', (t) => {
  const options = { dataset: 'databench', limit: 'all' };
  const samples = Array.from({ length: 5 }, (_, i) => ({ id: `databench:demo:${i}`, suite: 'demo' }));
  t.mock.method(plugins.find((plugin) => plugin.name === options.dataset), 'load', () => samples);
  const sampleIds = [samples[4].id, samples[0].id];
  assert.deepEqual(selectSamples({ ...options, sampleIds }).map((s) => s.id), [samples[0].id, samples[4].id]);
  for (const ids of [[], ['missing'], [samples[0].id, samples[0].id], [samples[0].id, 'missing']]) {
    assert.throws(() => selectSamples({ ...options, sampleIds: ids }), /sampleIds/);
  }
  assert.throws(() => selectSamples({ ...options, limit: '1', sampleIds }), /outside the selected scope/);
});

test('local semantic files are optional and invalid YAML is rejected', async (t) => {
  const { readSemantic } = await import('../ava-workflow/workflow.ts');
  const file = join(temporary(t), 'semantic.yaml');
  assert.equal(readSemantic(file), undefined);
  writeFileSync(file, 'description: Local business definitions');
  assert.deepEqual(readSemantic(file), { description: 'Local business definitions' });
  writeFileSync(file, 'models: [');
  assert.throws(() => readSemantic(file));
});

test('DataBench raw context exposes only the first three data rows and executes on the complete table', async () => {
  const { rawWorkflow } = await import('../ava-workflow/evals/databench.eval.ts');
  const { AVA } = await import('../../lib/index.js');
  const ava = new AVA({ llm: { model: 'unused' } });
  const source = ava.source.bind(ava);
  let prompt;
  ava.source = async (config) => {
    await source(config);
    ava.engine.schema = async () => { throw new Error('Raw context must not discover schema'); };
    ava.engine.profile = async () => { throw new Error('Raw context must not profile'); };
    ava.engine.getDSL = async (query, model) => {
      prompt = query;
      assert.deepEqual(model, { models: [] });
      return 'SELECT COUNT(*) AS answer FROM data';
    };
  };
  ava.semantic = async () => { throw new Error('Raw context must not load semantics'); };
  try {
    const result = await rawWorkflow(ava, { type: 'json', options: { data: [
      { id: 1, label: 'first' }, { id: 2, label: 'second' },
      { id: 3, label: 'third' }, { id: 4, label: 'hidden-fourth-row' },
    ] } }, 'How many records? Return one answer column.', { includeSummary: false, strategy: { type: 'direct' } });
    assert.match(prompt, /"3","third"/);
    assert.doesNotMatch(prompt, /hidden-fourth-row/);
    assert.match(prompt, /complete table/);
    assert.deepEqual(result.data, [{ answer: 4 }]);
  } finally {
    await ava.dispose();
  }
});

test('Spider2-Lite raw context isolates multi-table previews from metadata and queries full tables', async () => {
  const { rawWorkflow } = await import('../ava-workflow/evals/spider2lite.eval.ts');
  const { AVA } = await import('../../lib/index.js');
  const ava = new AVA({ llm: { model: 'unused' } });
  const source = ava.source.bind(ava);
  let calls = 0;
  ava.source = async config => {
    await source(config);
    ava.engine.schema = async () => { throw new Error('Raw context must not discover schema'); };
    ava.engine.profile = async () => { throw new Error('Raw context must not profile'); };
    ava.engine.getDSL = async (prompt, model) => {
      calls++;
      assert.deepEqual(model, { models: [] });
      for (const table of ['customers', 'products', 'sales', 'order notes'])
        assert(prompt.includes(`Table "${table}":`));
      assert.match(prompt, /ORD-0003/);
      assert.doesNotMatch(prompt, /ORD-0004|sqlite_sequence/);
      return 'SELECT COUNT(*) AS answer FROM sales';
    };
  };
  ava.semantic = async () => { throw new Error('Raw context must not load semantics'); };
  const input = { type: 'sqlite', options: { path: join(import.meta.dirname, '../../__tests__/datasets/sales.sqlite') } };
  const config = { includeSummary: false, strategy: { type: 'direct' } };
  try {
    const result = await rawWorkflow(ava, input, 'Count sales.', config, 4 * 1024 * 1024);
    assert.deepEqual(result.data, [{ answer: 240 }]);
    await assert.rejects(rawWorkflow(ava, input, 'Count sales.', config, 1), /Raw context exceeds/);
    assert.equal(calls, 1);
  } finally {
    await ava.dispose();
  }
});

test('metadata cache shares work, restores sessions and rejects stale or corrupt snapshots', async (t) => {
  const { createMetadataCache } = await import('../ava-workflow/metadata.ts');
  const { workflow } = await import('../ava-workflow/workflow.ts');
  const { AVA } = await import('../../lib/index.js');
  const { DuckDBEngine } = await import('../../lib/duckdb/index.js');
  const directory = temporary(t);
  const database = join(directory, 'sales.sqlite');
  const cacheDirectory = join(directory, 'cache');
  copyFileSync(join(import.meta.dirname, '../../__tests__/datasets/sales.sqlite'), database);
  const source = { type: 'sqlite', options: { path: database } };
  const first = new AVA({ llm: { model: 'unused' } });
  const second = new AVA({ llm: { model: 'unused' } });
  t.after(async () => { await first.dispose(); await second.dispose(); });
  await first.source(source);
  const profile = t.mock.method(first.engine, 'profile');
  const cache = createMetadataCache(cacheDirectory);
  const [snapshot] = await Promise.all(Array.from({ length: 20 }, () => cache(first, database)));
  assert.equal(profile.mock.callCount(), 1);
  t.mock.method(DuckDBEngine.prototype, 'schema', async () => { throw new Error('Schema was recomputed'); });
  t.mock.method(DuckDBEngine.prototype, 'profile', async () => { throw new Error('Profile was recomputed'); });
  second.analyze = async () => second.query('SELECT COUNT(*) AS n FROM sales');
  const disk = createMetadataCache(cacheDirectory);
  const result = await workflow(second, source, 'Count sales', {}, undefined, () => disk(second, database));
  assert.equal(result.data[0].n, 240);
  assert.deepEqual(await second.schema(), snapshot.schema);
  const file = join(cacheDirectory, readdirSync(cacheDirectory)[0]);
  const cached = JSON.parse(readFileSync(file));
  cached.metadata.profile.models[0].metrics.row_count = 999;
  writeFileSync(file, JSON.stringify(cached));
  await assert.rejects(createMetadataCache(cacheDirectory)(second, database), /integrity check failed/);
  appendFileSync(database, 'changed');
  const uncached = { schema: async () => { throw new Error('Fresh metadata required'); } };
  await assert.rejects(createMetadataCache(cacheDirectory)(uncached, database), /Fresh metadata required/);
});
