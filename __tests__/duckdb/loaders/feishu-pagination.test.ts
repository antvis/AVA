import { afterEach, describe, expect, it, vi } from 'vitest';

import { feishuPages, feishuRequest } from '../../../src/duckdb/loaders/feishu/api';
import { readRecords } from '../../../src/duckdb/loaders/feishu/read';

afterEach(() => vi.unstubAllGlobals());

const api = { token: 't', origin: 'https://open.feishu.cn' };
const table = { id: 'tbl1', name: '订单' };

/** Serve the given pages in order, ignoring the request. */
function stubPages(...pages: unknown[]) {
  const fetch = vi.fn(async () => Response.json(pages.shift() ?? { code: 0, data: {} }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const records = (...ids: string[]) => ids.map((id) => ({ record_id: id, fields: { n: id } }));

describe('feishuPages', () => {
  it('follows has_more and page_token until the last page', async () => {
    const fetch = stubPages(
      { code: 0, data: { items: [{ a: 1 }], has_more: true, page_token: 'p2', total: 2 } },
      { code: 0, data: { items: [{ a: 2 }], has_more: false, total: 2 } }
    );

    await expect(feishuPages(api, '/x', { pageSize: 500 })).resolves.toEqual({ items: [{ a: 1 }, { a: 2 }], total: 2 });
    const urls = fetch.mock.calls.map(([input]) => String(input));
    expect(urls).toEqual([
      'https://open.feishu.cn/x?page_size=500',
      'https://open.feishu.cn/x?page_size=500&page_token=p2',
    ]);
  });

  it('ignores a page token on the last page', async () => {
    stubPages({ code: 0, data: { items: [{ a: 1 }], has_more: false, page_token: 'stale', total: 25 } });

    await expect(feishuPages(api, '/x', { pageSize: 100 })).resolves.toEqual({ items: [{ a: 1 }], total: 25 });
  });

  it('accepts empty tables that return null items', async () => {
    stubPages({ code: 0, data: { items: null, has_more: false, total: 0 } });

    await expect(feishuPages(api, '/x', { pageSize: 100 })).resolves.toEqual({ items: [], total: 0 });
  });

  it('rejects has_more without a page token and repeated page tokens', async () => {
    stubPages({ code: 0, data: { items: [], has_more: true } });
    await expect(feishuPages(api, '/x', { pageSize: 1 })).rejects.toThrow('has_more without page_token');

    stubPages(
      { code: 0, data: { items: [], has_more: true, page_token: 'p' } },
      { code: 0, data: { items: [], has_more: true, page_token: 'p' } }
    );
    await expect(feishuPages(api, '/x', { pageSize: 1 })).rejects.toThrow('repeated page_token');
  });

  it('posts the search body with every page', async () => {
    const fetch = stubPages(
      { code: 0, data: { items: [], has_more: true, page_token: 'p2' } },
      { code: 0, data: { items: [], has_more: false } }
    );

    await feishuPages(api, '/search', { method: 'POST', pageSize: 500, body: { view_id: 'vew1' } });
    for (const [, init] of fetch.mock.calls as unknown as [string, Parameters<typeof fetch>[1]][]) {
      expect(init).toMatchObject({ method: 'POST', body: '{"view_id":"vew1"}' });
      expect(init!.headers).toMatchObject({
        Authorization: 'Bearer t',
        'Content-Type': 'application/json; charset=utf-8',
      });
    }
  });
});

describe('feishuRequest', () => {
  it('retries transient failures and reports the last Feishu error', async () => {
    const fetch = stubPages(
      { code: 1254607, msg: 'Data not ready' },
      { code: 1255040, msg: 'Request timed out' },
      { code: 0, data: { ok: true } }
    );
    await expect(feishuRequest(api, '/x')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry permission errors', async () => {
    const fetch = stubPages({ code: 91402, msg: 'NOTEXIST' });
    await expect(feishuRequest(api, '/x')).rejects.toEqual(new Error('Feishu Error 91402: NOTEXIST'));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports network failures and non-JSON responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>Bad Request</html>', { status: 400 }))
    );
    await expect(feishuRequest(api, '/x')).rejects.toThrow('response is not JSON (HTTP 400)');
  });
});

describe('readRecords', () => {
  it('reads every page of the record search API', async () => {
    const fetch = stubPages(
      { code: 0, data: { items: records('rec1'), has_more: true, page_token: 'p2', total: 2 } },
      { code: 0, data: { items: records('rec2'), has_more: false, total: 2 } }
    );

    await expect(readRecords(api, 'app', table)).resolves.toEqual([
      { id: 'rec1', fields: { n: 'rec1' } },
      { id: 'rec2', fields: { n: 'rec2' } },
    ]);
    expect(String(fetch.mock.calls[0][0])).toBe(
      'https://open.feishu.cn/open-apis/bitable/v1/apps/app/tables/tbl1/records/search?page_size=500'
    );
  });

  it('fails instead of returning a partial or duplicated table', async () => {
    stubPages({ code: 0, data: { items: records('rec1'), has_more: false, total: 3 } });
    await expect(readRecords(api, 'app', table)).rejects.toThrow('订单 reported 3 records but returned 1');

    stubPages(
      { code: 0, data: { items: records('rec1'), has_more: true, page_token: 'p2', total: 2 } },
      { code: 0, data: { items: records('rec1'), has_more: false, total: 2 } }
    );
    await expect(readRecords(api, 'app', table)).rejects.toThrow('returned record rec1 twice');
  });
});
