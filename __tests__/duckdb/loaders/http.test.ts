import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { sqlStringLiteral } from '../../../src/util/sql';
import { getLLMConfig } from '../../test-utils';

// Real loopback HTTP tests require httpfs and permission to listen on a local port.
describe.skipIf(process.env.AVA_HTTP_TEST !== '1')('native HTTP file reads', () => {
  let directory: string;
  let baseURL: string;
  let engine: DuckDBEngine;
  let active = 0;
  let peak = 0;
  let bytes = 0;
  let ranges = 0;
  const requests: string[] = [];
  const files = new Map<string, Buffer>();
  const server = createServer((req, res) => {
    requests.push(req.url!);
    const data = files.get(req.url!);
    if (req.headers.authorization !== 'Bearer test' || !data) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader('Accept-Ranges', 'bytes');
    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', data.length);
      res.end();
      return;
    }
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
    const body = data.subarray(start, end + 1);
    if (range) {
      ranges += 1;
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${data.length}`);
    }
    res.setHeader('Content-Length', body.length);
    bytes += body.length;
    active += 1;
    peak = Math.max(peak, active);
    setTimeout(() => {
      active -= 1;
      res.end(body);
    }, 15);
  });

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ava-http-'));
    const path = join(directory, 'data.parquet');
    const db = await DuckDBInstance.create(':memory:');
    const conn = await db.connect();
    try {
      await conn.run(`COPY (SELECT i::INTEGER AS id, (i % 97)::DOUBLE AS value,
        repeat(md5(i::VARCHAR), 8) AS padding FROM range(32768) t(i))
        TO ${sqlStringLiteral(path)} (FORMAT PARQUET, COMPRESSION uncompressed, ROW_GROUP_SIZE 2048)`);
      files.set('/data.parquet', await readFile(path));
      files.set('/data.csv', Buffer.from('id,value\n1,10\n2,20\n3,30\n'));
      const json = Buffer.from('[{"id":1,"profile":{"score":10}},{"id":2,"profile":{"score":20}}]');
      files.set('/data.json', json);
      files.set('/data.json.gz', gzipSync(json));
    } finally {
      conn.closeSync();
      db.closeSync();
    }
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing HTTP test address');
    baseURL = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await engine?.dispose();
    requests.length = 0;
    active = 0;
    peak = 0;
    bytes = 0;
    ranges = 0;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it('uses concurrent range reads for Parquet and blocks other URLs and local files', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'parquet',
      options: {
        path: `${baseURL}/data.parquet`,
        headers: { Authorization: 'Bearer test' },
      },
    });
    expect((await engine.schema()).models[0].columns.map(({ name }) => name)).toEqual(['id', 'value', 'padding']);
    const result = await engine.execute('SELECT SUM(value) AS total FROM data');
    expect(result.data).toEqual([
      { total: Array.from({ length: 32768 }, (_, i) => i % 97).reduce((a, b) => a + b, 0) },
    ]);
    expect(ranges).toBeGreaterThan(1);
    expect(peak).toBeGreaterThan(1);
    expect(bytes).toBeLessThan(files.get('/data.parquet')!.length);
    const count = requests.length;
    await expect(engine.execute(`SELECT * FROM read_parquet('${baseURL}/other.parquet')`)).rejects.toThrow();
    await expect(engine.execute(`SELECT * FROM read_csv('${baseURL}/data.csv')`)).rejects.toThrow();
    await expect(
      engine.execute(`SELECT * FROM read_text(${sqlStringLiteral(join(directory, 'data.parquet'))})`)
    ).rejects.toThrow();
    expect(requests).toHaveLength(count);
  });

  it('reads an authenticated CSV after configuration is locked', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'csv-file',
      options: {
        path: `${baseURL}/data.csv`,
        headers: { Authorization: 'Bearer test' },
      },
    });
    expect((await engine.execute('SELECT SUM(value) AS total FROM data')).data).toEqual([{ total: 60 }]);
  });

  it.each(['/data.json', '/data.json.gz'])(
    'loads %s as a typed snapshot using native format and compression detection',
    async (path) => {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'json-file',
        options: { path: `${baseURL}${path}`, headers: { Authorization: 'Bearer test' } },
      });
      const count = requests.length;
      const schema = await engine.schema();
      expect(schema.models[0].columns).toMatchObject([
        { name: 'id', type: 'BIGINT' },
        { name: 'profile', type: 'STRUCT(score BIGINT)' },
      ]);
      expect((await engine.execute('SELECT SUM(profile.score) AS total FROM data')).data).toEqual([{ total: 30 }]);
      expect((await engine.profile(schema, { metrics: ['row_count'] })).models[0].metrics.row_count).toBe(2);
      expect(requests).toHaveLength(count);
    }
  );
});
