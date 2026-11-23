const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { on, once } = require('node:events');
const { access, rm } = require('node:fs/promises');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { test } = require('node:test');
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

for (const release of [true, false]) {
  const outcome = release ? 'success' : 'cleanup timeout';
  test(`concurrent clients receive the same dispose ${outcome} before exit`, { timeout: 15_000 }, async (t) => {
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
    for (const event of ['cleanup-started', 'dispose-received', 'dispose-received']) {
      const {
        value: [received],
      } = await messages.next();
      assert.equal(received, event);
    }
    // Hold cleanup until both commands are inside the same daemon.
    if (release) child.send('release-cleanup');

    for (const reply of await replies) {
      if (release) {
        assert.deepEqual(reply, { status: 'fulfilled', value: { datasetId: id, disposed: true } });
      } else {
        assert.equal(reply.status, 'rejected');
        assert.equal(reply.reason.message, 'Dataset cleanup timed out after 2000 ms.');
      }
    }
    assert.deepEqual(await exited, [0, null]);
    await assert.rejects(access(directory), { code: 'ENOENT' });
  });
}

for (const command of ['analyze', 'profile', 'schema']) {
  test(
    `disconnecting during ${command} aborts ClickHouse I/O and frees the session`,
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
        sources: [
          { type: 'clickhouse', options: { url, database: 'default', log: { level: ClickHouseLogLevel.OFF } } },
        ],
        llm: { model: 'unused', apiKey: 'local-test', baseURL: `${url}/v1` },
      });
      if (command === 'profile') {
        await request(id, {
          command: 'schema',
          schema: {
            models: [
              {
                name: 'data',
                tableReference: { catalog: 'default', table: 'data' },
                columns: [{ name: 'amount', type: 'UInt32' }],
              },
            ],
          },
        });
      }

      const message =
        command === 'analyze' ? { command, strategy: 'direct', query: 'What is the total?' } : { command };
      const started = once(api, 'query-started', { signal: t.signal });
      const socket = await connectSession(id, JSON.stringify(message));
      socket.on('error', () => socket.destroy());
      t.after(() => socket.destroy());
      const [response] = await started;
      const disconnected = once(response, 'close', { signal: t.signal });
      assert.match(queries[0], command === 'profile' ? /count\(\)/i : /FROM system\.tables/i);

      socket.destroy();
      await disconnected;
      const result = await request(id, { command: 'query', dsl: 'SELECT 42 AS amount' });
      assert.deepEqual(result.data, [{ amount: 42 }]);
      assert.equal(queries.length, 2);
      await request(id, { command: 'dispose' });
      assert.deepEqual(await exited, [0, null]);
    }
  );
}
