const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');
const { selectSamples, modelQuestion, resultPayload } = require('./index');
const { compare, scoreSamples } = require('./score');

test('BIRD selection keeps question 0 and never exposes gold in model context', () => {
  const root = mkdtempSync(join(tmpdir(), 'bird-test-'));
  try {
    const rows = [0, 1].map((question_id) => ({
      question_id,
      db_id: 'demo',
      question: 'Question',
      evidence: 'Evidence',
      SQL: 'SECRET GOLD',
    }));
    writeFileSync(join(root, 'dev.json'), JSON.stringify(rows));
    assert.deepEqual(
      selectSamples({ id: ['0'], limit: 'all' }, root).map((s) => s.question_id),
      [0]
    );
    assert.throws(() => selectSamples({ id: ['missing'] }, root));
    assert.throws(() => selectSamples({ offset: '-1' }, root));
    assert.match(modelQuestion(rows[0]), /Evidence/);
    assert(!modelQuestion(rows[0]).includes('SECRET GOLD'));
    rows[1].question_id = 0;
    writeFileSync(join(root, 'dev.json'), JSON.stringify(rows));
    assert.throws(() => selectSamples({}, root), /duplicate/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('result serialization rejects truncation, preserves null/text and column order', () => {
  const result = { schema: [{ name: 'b' }, { name: 'a' }], data: [{ a: null, b: '001' }] };
  assert.deepEqual(resultPayload(result).rows, [['001', null]]);
  assert.throws(() => resultPayload({ ...result, truncated: true }), /truncated/);
  assert.throws(() => resultPayload({ schema: [{ name: 'a' }, { name: 'a' }], data: [] }), /Duplicate/);
  assert.throws(() => resultPayload({ schema: [{ name: 'x' }], data: [{ x: Infinity }] }), /Unsupported/);
});

test('SQLite gold comparison follows row-set semantics and isolates failures', async () => {
  const root = mkdtempSync(join(tmpdir(), 'bird-test-'));
  try {
    const dbDir = join(root, 'dev_databases/demo');
    mkdirSync(dbDir, { recursive: true });
    const database = join(dbDir, 'demo.sqlite');
    execFileSync('python3', [
      '-c',
      'import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("create table t (x integer, label text)"); c.executemany("insert into t values (?, ?)", [(1,"a"),(2,None),(1,"a")]); c.commit()',
      database,
    ]);
    const prediction = join(root, '0.json');
    const save = (
      rows,
      schema = [
        { name: 'x', type: 'INTEGER' },
        { name: 'label', type: 'VARCHAR' },
      ]
    ) => writeFileSync(prediction, JSON.stringify({ rows, schema }));
    const request = { database, prediction, sql: 'SELECT x, label FROM t' };
    save([
      [2, null],
      [1, 'a'],
    ]);
    assert.equal((await compare(request)).score, 1);
    save(
      [
        ['a', 1],
        [null, 2],
      ],
      [
        { name: 'label', type: 'VARCHAR' },
        { name: 'x', type: 'INTEGER' },
      ]
    );
    assert.equal((await compare(request)).score, 0);
    save(
      [
        ['1', 'a'],
        ['2', null],
      ],
      [
        { name: 'x', type: 'VARCHAR' },
        { name: 'label', type: 'VARCHAR' },
      ]
    );
    assert.equal((await compare(request)).score, 0);
    save([['9007199254740993']], [{ name: 'x', type: 'BIGINT' }]);
    assert.equal((await compare({ ...request, sql: 'SELECT 9007199254740993' })).score, 1);
    save([]);
    assert.equal((await compare({ ...request, sql: 'SELECT x, label FROM t WHERE 0' })).score, 1);
    await assert.rejects(compare({ ...request, sql: 'DELETE FROM t' }), /authorized|readonly/i);
    await assert.rejects(
      compare(
        { ...request, sql: 'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT sum(x) FROM n' },
        { timeout: 100 }
      ),
      /timed out/
    );
    save([
      [2, null],
      [1, 'a'],
    ]);
    const samples = [0, 1].map((question_id) => ({
      question_id,
      db_id: 'demo',
      SQL: request.sql,
      difficulty: 'simple',
    }));
    const report = await scoreSamples({ samples, root, predictions: root, output: join(root, 'report.json') });
    assert.equal(report.accuracy, 0.5);
    assert.equal(report.missing, 1);
    assert.equal(report.difficulties.simple.total, 2);
    assert.equal(JSON.parse(readFileSync(join(root, 'report.json'))).passed, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('workflow passes only question and evidence; model request disables thinking', async () => {
  const { runSample } = await import('../ava-workflow/evals/bird.eval.ts');
  const events = [];
  const ava = {
    source: async () => events.push('source'),
    profile: async () => events.push('profile'),
    analyze: async (question, options) => {
      events.push('analyze');
      assert(!question.includes('SECRET GOLD'));
      assert.match(question, /Evidence/);
      assert.equal(options.includeSummary, false);
      return {};
    },
  };
  await runSample(
    ava,
    { question_id: 0, db_id: 'demo', question: 'Question', evidence: 'Evidence', SQL: 'SECRET GOLD' },
    '/tmp',
    { type: 'direct' }
  );
  assert.deepEqual(events, ['source', 'profile', 'analyze']);
  const { llmConfig } = await import('../ava-workflow/model.ts');
  const { generateText } = require('ai');
  const previous = { fetch: global.fetch, key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL };
  try {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'test-model';
    let body;
    global.fetch = async (_, init) => {
      body = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          id: 'test',
          object: 'chat.completion',
          created: 0,
          model: 'test-model',
          choices: [{ index: 0, message: { role: 'assistant', content: 'SELECT 1' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
        { headers: { 'content-type': 'application/json' } }
      );
    };
    await generateText({ model: llmConfig().model, prompt: 'Query', maxRetries: 0 });
    assert.equal(body.chat_template_kwargs.enable_thinking, false);
  } finally {
    global.fetch = previous.fetch;
    if (previous.key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous.key;
    if (previous.model === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previous.model;
  }
});
