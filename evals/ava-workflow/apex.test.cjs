const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

test('APEX BIRD keeps raw question separate, skips static profile and excludes gold', async () => {
  const { runSample } = await import('./evals/bird.eval.ts');
  const root = mkdtempSync(join(tmpdir(), 'apex-bird-'));
  const events = [];
  try {
    const descriptions = join(root, 'dev_databases/demo/database_description');
    mkdirSync(descriptions, { recursive: true });
    writeFileSync(join(descriptions, 'items.csv'), 'id,Identifier');
    await runSample({
      source: async () => events.push('source'),
      profile: async () => events.push('profile'),
      analyze: async (question, config) => {
        events.push('analyze');
        assert.equal(question, 'How many items?');
        assert.equal(config.strategy.evidence, 'Only active items');
        assert.match(config.strategy.schemaDescriptions, /Identifier/);
        assert(!JSON.stringify({ question, config }).includes('SECRET_GOLD'));
      },
    }, { question_id: 0, db_id: 'demo', question: 'How many items?', evidence: 'Only active items', SQL: 'SECRET_GOLD' }, root, { type: 'apex', samples: 2 }, true);
    assert.deepEqual(events, ['source', 'analyze']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('APEX Spider-Lite separates external documents and still enforces input size limits', async () => {
  const { runSample } = await import('./evals/spider2lite.eval.ts');
  const root = mkdtempSync(join(tmpdir(), 'apex-spider-'));
  try {
    mkdirSync(join(root, 'resource/documents'), { recursive: true });
    writeFileSync(join(root, 'resource/documents/guide.md'), 'Active means status = 1.');
    let called = false;
    const ava = {
      source: async () => {},
      profile: async () => { throw new Error('Must not profile'); },
      analyze: async (question, config) => {
        called = true;
        assert.equal(question, 'Count active items');
        assert.match(config.strategy.evidence, /status = 1/);
        assert(!JSON.stringify(config).includes('SECRET_GOLD'));
      },
    };
    const sample = { instance_id: 'local001', db: 'demo', question: 'Count active items', external_knowledge: 'guide.md', SQL: 'SECRET_GOLD' };
    await runSample(ava, sample, root, { type: 'apex' }, 4096);
    assert(called);
    await assert.rejects(runSample(ava, sample, root, { type: 'apex' }, 4), /exceeds/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('strategy defaults, candidate budgets and ablations are explicit', async () => {
  const { strategyConfig } = await import('./strategies.ts');
  assert.deepEqual(strategyConfig({ strategy: 'apex' }), { type: 'apex', samples: 1, maxSteps: 40 });
  assert.deepEqual(strategyConfig({ strategy: 'loop' }), { type: 'loop', maxSteps: 12 });
  assert.throws(() => strategyConfig({ strategy: 'apex', samples: '9' }), /at most 8/);
  assert.throws(() => strategyConfig({ strategy: 'apex', ablation: 'unknown' }), /ablation/);
});
