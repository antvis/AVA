const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { on, once } = require('node:events');
const { access, mkdtemp, readFile, rm } = require('node:fs/promises');
const { createServer } = require('node:http');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const { setTimeout: wait } = require('node:timers/promises');
const { ClickHouseLogLevel } = require('@clickhouse/client');

const { request } = require('../lib/cli/session/client');
const { connectSession, prepareSession } = require('../lib/cli/session/transport');

async function startSession(t, startup, execArgv = []) {
  const id = `ds_${randomBytes(12).toString('hex')}`;
  const directory = await prepareSession(id);
  const child = fork(join(__dirname, '../lib/cli/session/server.js'), [id], {
    execArgv,
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  const exited = once(child, 'exit');
  const messages = on(child, 'message', { signal: t.signal });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
    await messages.return();
    await rm(directory, { recursive: true, force: true });
  });
  child.send(startup);
  const {
    value: [ready],
  } = await messages.next();
  assert.deepEqual(ready, { ok: true, result: null });
  return { id, directory, child, exited, messages };
}

test(
  'concurrent dispose requests share one cleanup that can finish after the reply timeout',
  { timeout: 15_000 },
  async (t) => {
    const { id, directory, child, exited, messages } = await startSession(
      t,
      {
        sources: [{ type: 'json', options: { data: [{ amount: 42 }] } }],
        llm: { model: 'unused' },
        engine: 'javascript',
      },
      ['--require', join(__dirname, 'fixtures/cli-session-dispose.cjs')]
    );

    const replies = Promise.allSettled([request(id, { command: 'dispose' }), request(id, { command: 'dispose' })]);
    const started = [];
    for (let i = 0; i < 3; i++) {
      const {
        value: [received],
      } = await messages.next();
      started.push(received);
    }
    assert.deepEqual(started.sort(), ['cleanup-started', 'dispose-received', 'dispose-received']);
    for (const reply of await replies) {
      assert.equal(reply.status, 'rejected');
      assert.equal(reply.reason.message, 'Dataset cleanup timed out after 2000 ms.');
    }
    assert.equal(child.exitCode, null, 'The daemon must keep cleaning up after its clients time out');
    child.send('release-cleanup');
    const event = await Promise.race([
      messages.next().then(({ value: [message] }) => message),
      exited.then(() => 'daemon-exited'),
    ]);
    assert.equal(event, 'cleanup-finished');
    assert.deepEqual(await exited, [0, null]);
    await assert.rejects(access(directory), { code: 'ENOENT' });
  }
);

test(
  'disconnecting during analysis cancels ClickHouse catalog I/O and frees the session',
  { timeout: 15_000 },
  async (t) => {
    const queries = [];
    const api = createServer((req, res) => {
      let sql = '';
      req.setEncoding('utf8').on('data', (chunk) => {
        sql += chunk;
      });
      req.on('end', () => {
        queries.push(sql);
        if (queries.length === 1) api.emit('query-started', res);
        else if (sql.includes('SELECT 42 AS amount')) res.end('{"amount":42}\n');
        else res.writeHead(500).end('Unexpected request after cancellation');
      });
    });
    api.listen(0, '127.0.0.1');
    t.after(() => {
      api.closeAllConnections();
      api.close();
    });
    await once(api, 'listening', { signal: t.signal });
    const url = `http://127.0.0.1:${api.address().port}`;
    const { id, exited } = await startSession(t, {
      sources: [{ type: 'clickhouse', options: { url, database: 'default', log: { level: ClickHouseLogLevel.OFF } } }],
      llm: { model: 'unused', apiKey: 'local-test', baseURL: `${url}/v1` },
    });
    const started = once(api, 'query-started', { signal: t.signal });
    const socket = await connectSession(
      id,
      JSON.stringify({ command: 'analyze', strategy: 'direct', query: 'What is the total?' })
    );
    socket.on('error', () => socket.destroy());
    t.after(() => socket.destroy());
    const [response] = await started;
    const disconnected = once(response, 'close', { signal: t.signal });
    assert.match(queries[0], /FROM system\.tables/i);

    socket.destroy();
    await disconnected;
    const result = await request(id, { command: 'query', dsl: 'SELECT 42 AS amount' });
    assert.deepEqual(result.data, [{ amount: 42 }]);
    assert.equal(queries.length, 2);
    assert.deepEqual(await request(id, { command: 'dispose' }), { datasetId: id, disposed: true });
    assert.deepEqual(await exited, [0, null]);
  }
);

test(
  'disconnecting reaps the Python subprocess and frees the session',
  { skip: process.env.AVA_PYTHON_LOCAL_TEST !== '1', timeout: 15_000 },
  async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'ava-python-abort-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const marker = join(directory, 'pid');
    const { id, exited } = await startSession(t, {
      sources: [{ type: 'json', options: { data: [{ amount: 42 }] } }],
      llm: { model: 'unused' },
      engine: 'python',
    });
    const dsl = `import os, signal, time
from pathlib import Path
signal.signal(signal.SIGTERM, signal.SIG_IGN)
Path(${JSON.stringify(marker)}).write_text(str(os.getpid()))
time.sleep(20)
result = df`;
    const socket = await connectSession(id, JSON.stringify({ command: 'query', dsl }));
    socket.on('error', () => socket.destroy());
    t.after(() => socket.destroy());
    let pid;
    while (!pid) {
      const value = await readFile(marker, 'utf8').catch((error) => {
        if (error.code !== 'ENOENT') throw error;
        return '';
      });
      pid = Number(value);
      if (!pid) await wait(25, undefined, { signal: t.signal });
    }

    socket.destroy();
    const next = await request(id, { command: 'schema' });
    assert.equal(next.models[0].name, 'data');
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
    await request(id, { command: 'dispose' });
    assert.deepEqual(await exited, [0, null]);
  }
);
