import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { NotionClient } from '../../../src/duckdb/loaders/notion/client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Notion REST client wire integration (offline)', () => {
  it('calls the database retrieve and query endpoints with the Bearer token and Notion-Version', async () => {
    const calls: { method: string; url: string; authorization: string; version: string; body?: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input, init) => {
        calls.push({
          method: String(init?.method),
          url: String(input),
          authorization: (init?.headers as Record<string, string>)['Authorization'],
          version: (init?.headers as Record<string, string>)['Notion-Version'],
          body: init?.body ? String(init.body) : undefined,
        });
        const url = String(input);
        if (url.includes('/query')) {
          return Response.json({ object: 'list', results: [], has_more: false, next_cursor: null });
        }
        return Response.json({
          object: 'database',
          id: 'db-id',
          properties: {
            Amount: { id: 'amount', name: 'Amount', type: 'number', number: { format: 'number' } },
          },
        });
      })
    );
    const client = new NotionClient(new AbortController().signal, 'secret-token', '2022-06-28', 0);
    await client.retrieveDatabase('db-id');
    await client.queryDatabase('db-id', { page_size: 100 });
    expect(calls.map((c) => c.url)).toEqual([
      'https://api.notion.com/v1/databases/db-id',
      'https://api.notion.com/v1/databases/db-id/query',
    ]);
    expect(calls[0].method).toBe('GET');
    expect(calls[1].method).toBe('POST');
    expect(calls[1].body).toBe('{"page_size":100}');
    for (const call of calls) {
      expect(call.authorization).toBe('Bearer secret-token');
      expect(call.version).toBe('2022-06-28');
    }
  });

  it('surfaces upstream status/code and redacts the token from diagnostics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: 'unauthorized', message: 'bad token secret-token' }, { status: 401 }))
    );
    const client = new NotionClient(new AbortController().signal, 'secret-token', '2022-06-28', 0);
    await expect(client.retrieveDatabase('db-id')).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
    });
    await expect(client.retrieveDatabase('db-id')).rejects.toThrow(/\[REDACTED\]/);
  });

  it('retries transient failures up to the configured retry count', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ object: 'database', id: 'db-id', properties: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new NotionClient(new AbortController().signal, 'token', '2022-06-28', 2);
    await client.retrieveDatabase('db-id');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a connection reset while reading a successful response body', async () => {
    const interruptedBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"object":"database"'));
        controller.error(new Error('socket reset'));
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(interruptedBody, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ object: 'database', id: 'db-id', properties: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new NotionClient(new AbortController().signal, 'token', '2022-06-28', 1);
    await expect(client.retrieveDatabase('db-id')).resolves.toMatchObject({ id: 'db-id' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aborts a stalled request within the whole-load deadline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (input, init) =>
          new Promise((_resolve, reject) => {
            if (init.signal.aborted) reject(new Error('aborted'));
            else init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          })
      )
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await expect(
        ava.source({
          type: 'notion',
          options: { databaseId: 'db', token: 'fake-token', timeoutMs: 50 },
        })
      ).rejects.toThrow('deadline exceeded');
      expect(ava.engine).toBeNull();
    } finally {
      await ava.dispose();
    }
  });

  it('completes schema retrieval and a cursor-paginated query into real DuckDB', async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/query')) {
        const body = JSON.parse(String(init?.body));
        return Response.json(
          body.start_cursor
            ? { object: 'list', results: [], has_more: false, next_cursor: null }
            : {
                object: 'list',
                results: [{ object: 'page', id: 'r1', properties: { Amount: { type: 'number', number: 42 } } }],
                has_more: true,
                next_cursor: 'c1',
              }
        );
      }
      return Response.json({
        object: 'database',
        id: 'db-id',
        properties: {
          Amount: { id: 'amount', name: 'Amount', type: 'number', number: { format: 'number' } },
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'notion', options: { databaseId: 'db-id', token: 'fake-token', pageSize: 1 } });
      expect((await ava.query('SELECT sum(Amount) AS total FROM data')).data).toEqual([{ total: 42 }]);
      const queryCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes('/query'));
      expect(queryCalls).toHaveLength(2);
      expect(queryCalls.map((c) => JSON.parse(String(c[1].body)).start_cursor)).toEqual([undefined, 'c1']);
    } finally {
      await ava.dispose();
    }
  });
});
