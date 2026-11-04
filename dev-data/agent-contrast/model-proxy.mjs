// Local screenshot helper: credentials stay on the server; logs contain synthetic prompts and model output only.
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';

assert(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
assert.equal(new URL(process.env.OPENAI_BASE_URL).origin, 'https://antchat.alipay.com');
const directory = new URL('./runs/', import.meta.url);
await mkdir(directory, { recursive: true });
let sequence = 0;
http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && !['http://127.0.0.1:3000', 'http://localhost:3000'].includes(origin)) {
    response.writeHead(403).end();
    return;
  }
  response.setHeader('Access-Control-Allow-Origin', origin || 'http://127.0.0.1:3000');
  response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-stainless-retry-count');
  if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
  if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
    response.writeHead(404).end(); return;
  }
  const id = `${Date.now()}-${++sequence}`;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 2_000_000) throw new Error('Request too large');
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks));
    body.model = process.env.OPENAI_MODEL;
    await writeFile(new URL(`${id}.request.json`, directory), JSON.stringify(body, null, 2));
    const upstream = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify(body), signal: AbortSignal.timeout(240_000),
    });
    response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' });
    const saved = [];
    for await (const chunk of Readable.fromWeb(upstream.body)) { saved.push(chunk); response.write(chunk); }
    response.end();
    await writeFile(new URL(`${id}.response.txt`, directory), Buffer.concat(saved));
    console.log(id, upstream.status);
  } catch (error) {
    console.error(id, error.message);
    if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'Local model proxy failed; inspect terminal.' } }));
  }
}).listen(3345, '127.0.0.1', () => console.log('Local model proxy: http://127.0.0.1:3345/v1'));
