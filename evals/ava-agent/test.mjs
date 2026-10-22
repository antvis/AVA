import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, truncateSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateResult, readSessionResult } from './lib/sql-results.mjs';
import { MAX_ATTACHMENT_BYTES, readFixture } from './lib/attachments.mjs';
import { prepareSnapshot } from './evals/sql.ts';
import { writeResult as writeBirdResult } from './evals/bird.eval.ts';
import { writeResult as writeSpiderResult } from './evals/spider2lite.eval.ts';
import { main as runDataBench } from './evals/databench.eval.ts';
import { plugins } from '../databench/index.js';
import { run } from './scripts/run.mjs';

function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), 'ava-agent-sql-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('SQLite attachments accept files above 100 MiB and enforce the shared 1 GiB limit', async (t) => {
  const directory = temporary(t);
  mkdirSync(join(directory, 'evals/fixtures'), { recursive: true });
  const file = join(directory, 'evals/fixtures/0.sqlite');
  writeFileSync(file, '');
  const size = 100 * 1024 * 1024 + 1;
  truncateSync(file, size);
  assert.equal((await readFixture('ava-fixture:0.sqlite', directory)).length, size);
  assert.equal(MAX_ATTACHMENT_BYTES, 1024 * 1024 * 1024);
  truncateSync(file, MAX_ATTACHMENT_BYTES + 1);
  await assert.rejects(readFixture('ava-fixture:0.sqlite', directory), /exceeds 1 GiB/);
  await assert.rejects(readFixture('ava-fixture:../0.sqlite', directory), /Unsupported/);
  await assert.rejects(readFixture('ava-fixture:0.json', directory), /Unsupported/);
});

test('SQL results preserve empty tables and nulls, rejecting invalid or truncated data', () => {
  const value = { schema: [{ name: 'n', type: 'INTEGER' }], rows: [[null], [1], ['9007199254740993']] };
  assert.equal(validateResult(value), value);
  assert.deepEqual(validateResult({ ...value, rows: [] }).rows, []);
  for (const invalid of [null, {}, { ...value, truncated: true }, { ...value, rows: [[1, 2]] },
    { ...value, rows: [[{}]] }, { ...value, rows: [[Infinity]] }, { ...value, rows: Array(10001).fill([1]) }]) {
    assert.throws(() => validateResult(invalid), /Invalid/);
  }
});

test('Docker retrieval requires exactly one evaluation container', async (t) => {
  const directory = temporary(t);
  const executable = join(directory, 'docker');
  const oldPath = process.env.PATH;
  process.env.PATH = `${directory}:${oldPath}`;
  t.after(() => { process.env.PATH = oldPath; });
  const payload = { schema: [{ name: 'n', type: 'INTEGER' }], rows: [[42]] };
  writeFileSync(executable, `#!/bin/sh\nif [ "$1" = ps ]; then echo container; else printf '%s' '${JSON.stringify(payload)}'; fi\n`, { mode: 0o755 });
  assert.deepEqual(await readSessionResult('session'), payload);
  writeFileSync(executable, '#!/bin/sh\nprintf "first\\nsecond\\n"\n');
  await assert.rejects(readSessionResult('session'), /exactly one/);
});

test('Eve discovers both snapshots and resolves SQLite attachments without a model', async (t) => {
  const directory = temporary(t);
  const database = join(directory, 'db.sqlite');
  writeFileSync(database, 'fixture');
  for (const benchmark of ['bird', 'spider2lite']) {
    let snapshot;
    try {
      const result = await run('eval', [benchmark, '--list'], (path) => {
        snapshot = path;
        return prepareSnapshot(path, benchmark, [
          { id: 'smoke', suite: 'fixture', question: 'Snapshot import check', database },
          { id: 'other', suite: 'fixture', question: 'Same database', database },
        ]);
      });
      assert.equal(result.code, 0);
      const samples = JSON.parse(readFileSync(join(snapshot, 'benchmarks/samples.json')));
      assert.equal(samples[0].database, samples[1].database);
      const payload = { schema: [{ name: 'text', type: 'TEXT' }, { name: 'count', type: 'INTEGER' }],
        rows: [['a,"b"\nc', null], ['other', 42]] };
      if (benchmark === 'bird') {
        writeBirdResult(snapshot, 'smoke', payload);
        assert.deepEqual(JSON.parse(readFileSync(join(snapshot, 'exec_result/smoke.json'))), payload);
      } else {
        await writeSpiderResult(snapshot, 'smoke', payload);
        assert.equal(readFileSync(join(snapshot, 'exec_result/smoke.csv'), 'utf8'),
          '"text","count"\n"a,""b""\nc",""\n"other","42"\n');
      }
      assert.equal((await readFixture(`ava-fixture:${samples[0].database}`, snapshot)).toString(), 'fixture');
    } finally {
      if (snapshot) rmSync(snapshot, { recursive: true, force: true });
    }
  }
});

test('DataBench lists cases from an ESM snapshot without a model', async (t) => {
  const directory = temporary(t);
  const dataPath = join(directory, 'fixture.parquet');
  writeFileSync(dataPath, 'fixture');
  t.mock.method(plugins.find((plugin) => plugin.name === 'databench-lite'), 'load', () => [{
    id: 'databench-lite:fixture:01', dataset: 'databench-lite', suite: 'fixture',
    question: 'Snapshot import check', answerType: 'number', goldAnswer: '1', dataPath,
  }]);
  let snapshot;
  const log = console.error;
  t.mock.method(console, 'error', (message) => {
    if (message.startsWith('ava-agent ava: ')) snapshot = message.slice('ava-agent ava: '.length);
    log(message);
  });
  try {
    await runDataBench(['--list', '--limit', '1']);
    assert(snapshot);
    assert.equal(process.exitCode, 0);
    assert.deepEqual(JSON.parse(readFileSync(join(snapshot, 'benchmarks/package.json'))), { type: 'module' });
    const samples = JSON.parse(readFileSync(join(snapshot, 'benchmarks/samples.json')));
    assert.equal(samples[0].id, 'databench-lite:fixture:01');
    assert.equal(readFileSync(join(snapshot, samples[0].dataPath), 'utf8'), 'fixture');
  } finally {
    if (snapshot) rmSync(snapshot, { recursive: true, force: true });
  }
});
