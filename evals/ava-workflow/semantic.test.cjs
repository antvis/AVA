const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { SemanticRegistry } = require('../../lib/semantic/registry');
const { compileSMQ } = require('../../lib/semantic/compiler');
const { parseSemanticConfig } = require('../../lib/semantic/schema');

test('requests scalar rows for list answers without altering returned values', async () => {
  const { answerInstruction, answerFrom } = await import('./evals/databench.eval.ts');
  assert.match(answerInstruction('list[number]'), /one scalar number value per row/);
  assert.match(answerInstruction('list[category]'), /Do not wrap values in SQL arrays/);
  assert.equal(answerInstruction('boolean'), 'Return a single boolean value in one column named answer.');
  assert.equal(answerFrom([{ answer: 2 }, { answer: 2 }, { answer: 3 }], 'list[number]'), '[2, 2, 3]');
  assert.throws(() => answerFrom([{ label: 'A', count: 2 }], 'list[category]'), /one column/);
  assert.throws(() => answerFrom([{ answer: 2 }, { answer: 3 }], 'number'), /one row/);
  assert.throws(() => answerFrom([{ answer: [2, 3] }], 'list[number]'), /scalar/);
});

test('selects exactly the requested IDs and rejects duplicate or missing IDs', async () => {
  const { selectByIds } = await import('./evals/databench.eval.ts');
  const samples = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(selectByIds(samples, ['c', 'a']), [{ id: 'a' }, { id: 'c' }]);
  for (const ids of [[], ['a', 'a'], ['missing'], [1], {}]) assert.throws(() => selectByIds(samples, ids));
});

test('loads and compiles all 79 explicit YAML configs', async () => {
  const { loadSemanticFiles } = await import('./semantic.ts');
  const dir = join(__dirname, '../databench/semantics');
  const files = readdirSync(dir).filter((f) => /^\d.*\.yaml$/.test(f)).sort();
  assert.equal(files.length, 79);
  assert.deepEqual(readdirSync(dir).filter((f) => /^\d.*\.json$/.test(f)), []);
  for (const file of files) {
    const suite = file.slice(0, -5);
    const loaded = loadSemanticFiles([{ suite, dataPath: suite }])[suite];
    assert.deepEqual(loaded.config, parseSemanticConfig(readFileSync(join(dir, file), 'utf8')));
    const registry = new SemanticRegistry(loaded.config);
    const model = loaded.config.models[0];
    const ref = (name) => `${model.name}__${name}`;
    assert.match(compileSMQ(registry, {
      group_by: [...model.dimensions, ...model.measures].map((e) => ref(e.name)), limit: 1,
    }).sql, /^SELECT DISTINCT/);
    assert.match(compileSMQ(registry, { metrics: model.metrics.map((e) => ref(e.name)) }).sql, /^SELECT/);
  }
});

test('fails closed for missing/invalid YAML and hashes the actual source bytes', async () => {
  const { loadSemanticFiles } = await import('./semantic.ts');
  const dir = mkdtempSync(join(tmpdir(), 'ava-semantic-'));
  try {
    const sample = { suite: 'demo', dataPath: 'data.parquet' };
    assert.throws(() => loadSemanticFiles([sample], dir));
    const file = join(dir, 'demo.yaml');
    writeFileSync(file, 'models: [');
    assert.throws(() => loadSemanticFiles([sample], dir));
    const yaml = 'models:\n  - name: demo\n    table: data\n    metrics:\n      - { name: count, agg: count }\n';
    writeFileSync(file, yaml);
    const first = loadSemanticFiles([sample], dir)[sample.dataPath];
    writeFileSync(file, yaml + '# Updated configuration comment\n');
    const second = loadSemanticFiles([sample], dir)[sample.dataPath];
    assert.notEqual(first.sha256, second.sha256);
    assert.deepEqual(first.config, second.config);
    assert.throws(() => loadSemanticFiles([{ suite: '../demo', dataPath: 'x' }], dir), /Invalid/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('schema-derived Spider2 configs expose three element kinds', async () => {
  const { semanticFromSchema } = await import('./semantic.ts');
  const config = semanticFromSchema({ tables: [{ name: 'orders', fields: [
    { name: 'channel', type: 'VARCHAR' }, { name: 'amount', type: 'DOUBLE' },
  ] }] });
  const registry = new SemanticRegistry(config);
  assert.equal(registry.resolve('orders__channel').kind, 'dimension');
  assert.equal(registry.resolve('orders__amount').kind, 'measure');
  assert.equal(registry.resolve('orders__sum_amount').kind, 'metric');
  assert.match(compileSMQ(registry, {
    metrics: ['orders__sum_amount'], group_by: ['orders__channel'], filters: ['orders__amount > 0'],
  }).sql, /WHERE "orders"\."amount" > 0/);
});

test('BIRD explicit SQLite config preserves role joins and fails closed when a file is missing', async () => {
  const { prepareStrategy } = await import('./strategies.ts');
  const directory = join(__dirname, '../BIRD/semantics');
  const strategy = await prepareStrategy({ strategy: 'semantic' }, {
    type: 'sqlite', paths: ['/unused/superhero.sqlite'], semanticDirectory: directory,
  });
  let config;
  strategy.setup({ semantic: (value) => { config = value; } }, {
    type: 'sqlite', options: { path: '/unused/superhero.sqlite' },
  });
  assert.equal(strategy.manifest.semanticGenerator, 'file-v3');
  assert.equal(strategy.manifest.semanticProtocol, 'smq-v4');
  const registry = new SemanticRegistry(config);
  const sql = compileSMQ(registry, { metrics: [
    'superhero__superhero_name', 'superhero_eye_colour_id_role__colour',
    'superhero_hair_colour_id_role__colour',
  ], limit: 1 }).sql;
  assert.match(sql, /"eye_colour_id"\s*=\s*"superhero_eye_colour_id_role"\."id"/);
  assert.match(sql, /"hair_colour_id"\s*=\s*"superhero_hair_colour_id_role"\."id"/);
  await assert.rejects(prepareStrategy({ strategy: 'semantic' }, {
    type: 'sqlite', paths: ['/unused/missing.sqlite'], semanticDirectory: directory,
  }), /ENOENT/);
});

test('records explicit generation settings without disabling provider reasoning by default', async () => {
  const { modelSettings } = await import('./model.ts');
  assert.deepEqual(modelSettings(), { thinking: 'provider', temperature: undefined, maxOutputTokens: undefined });
  assert.deepEqual(modelSettings({ thinking: 'on', temperature: '0.1', 'max-output-tokens': '16384' }), {
    thinking: 'on', temperature: 0.1, maxOutputTokens: 16384,
  });
  assert.throws(() => modelSettings({ thinking: 'high' }), /thinking/);
  assert.throws(() => modelSettings({ temperature: 'NaN' }), /temperature/);
  assert.throws(() => modelSettings({ 'max-output-tokens': '0' }), /max-output-tokens/);
});
