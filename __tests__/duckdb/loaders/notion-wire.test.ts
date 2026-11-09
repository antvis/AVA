import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { NotionClient } from '../../../src/duckdb/loaders/notion/client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Notion REST client wire integration (offline)', { timeout: 20000 }, () => {
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

  it('retrieves page property items with their own cursor and page size', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = String(input);
        calls.push(url);
        return Response.json({
          object: 'list',
          type: 'property_item',
          results: [],
          has_more: false,
          next_cursor: null,
          property_item: { id: 'owner/id', type: 'people', people: {}, next_url: null },
        });
      })
    );
    const client = new NotionClient(new AbortController().signal, 'secret-token', '2022-06-28', 0);
    await client.retrievePropertyItem('page/id', 'owner/id');
    await client.retrievePropertyItem('page/id', 'owner/id', 'cursor/value');
    expect(calls).toEqual([
      'https://api.notion.com/v1/pages/page%2Fid/properties/owner%2Fid?page_size=100',
      'https://api.notion.com/v1/pages/page%2Fid/properties/owner%2Fid?page_size=100&start_cursor=cursor%2Fvalue',
    ]);
  });

  it('loads paginated pages and complete computed properties into real DuckDB', async () => {
    const range = { start: '2026-01-01T09:00:00', end: '2026-01-02T10:30:00', time_zone: 'Asia/Shanghai' };
    const formula = (id: string, type: string, value: unknown) => ({
      object: 'property_item',
      id,
      type: 'formula',
      formula: { type, [type]: value },
    });
    const page = (id: string, amount: number, tags: { name: string }[]) => ({
      object: 'page',
      id,
      properties: {
        Amount: { id: 'amount', type: 'number', number: amount },
        Total: { id: 'total', type: 'formula', formula: { type: 'number', number: null } },
        Window: {
          id: 'window',
          type: 'formula',
          formula: { type: 'date', date: null },
        },
        Tags: { id: 'tags', type: 'multi_select', multi_select: tags },
      },
    });
    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      if (url.includes('/properties/')) {
        const pageId = url.includes('/pages/r1/') ? 'r1' : 'r2';
        if (url.includes('/properties/total?')) {
          return Response.json(formula('total', 'number', pageId === 'r1' ? 8 : null));
        }
        return Response.json(formula('window', 'date', pageId === 'r1' ? range : null));
      }
      if (url.endsWith('/query')) {
        const body = JSON.parse(String(init?.body));
        return Response.json(
          body.start_cursor
            ? {
                object: 'list',
                results: [page('r2', 0, [{ name: 'a' }, { name: 'b' }])],
                has_more: false,
                next_cursor: null,
              }
            : {
                object: 'list',
                results: [page('r1', 42, [{ name: 'a, b' }])],
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
          Total: { id: 'total', name: 'Total', type: 'formula', formula: { expression: '1 + 1' } },
          Window: { id: 'window', name: 'Window', type: 'formula', formula: { expression: 'now()' } },
          Tags: { id: 'tags', name: 'Tags', type: 'multi_select', multi_select: { options: [] } },
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'notion', options: { databaseId: 'db-id', token: 'fake-token', pageSize: 1 } });
      expect(
        (await ava.query('SELECT sum(Amount) AS amount, sum(Total) AS total, count(Total) AS populated FROM data')).data
      ).toEqual([{ amount: 42, total: 8, populated: 1 }]);
      expect((await ava.query('SELECT "Window" AS window, "Tags" AS tags FROM data ORDER BY _id')).data).toEqual([
        { window: range, tags: ['a, b'] },
        { window: null, tags: ['a', 'b'] },
      ]);
      expect((await ava.profile({ metrics: ['row_count'] })).models[0].metrics).toEqual({ row_count: 2 });
      const queryCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes('/query'));
      expect(queryCalls).toHaveLength(2);
      expect(queryCalls.map((c) => JSON.parse(String(c[1].body)).start_cursor)).toEqual([undefined, 'c1']);
      const propertyCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes('/properties/'));
      expect(propertyCalls).toHaveLength(4);
      expect(propertyCalls.every(([input]) => String(input).includes('page_size=100'))).toBe(true);
    } finally {
      await ava.dispose();
    }
  });
});
