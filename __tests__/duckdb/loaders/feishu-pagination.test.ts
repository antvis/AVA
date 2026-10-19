import { afterEach, describe, expect, it, vi } from 'vitest';
import { readTable } from '../../../src/duckdb/loaders/feishu/read';

afterEach(() => vi.unstubAllGlobals());

describe('readTable pagination', () => {
  it('follows has_more and page_token until the last page', async () => {
    const requests: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes('tenant_access_token')) return Response.json({ code: 0, tenant_access_token: 't' });
      if (url.includes('/fields')) return Response.json({ code: 0, data: { items: [{ field_name: 'n', type: 2 }] } });
      const data = url.includes('page_token=p2')
        ? { items: [{ fields: { n: 2 } }], has_more: false }
        : { items: [{ fields: { n: 1 } }], has_more: true, page_token: 'p2' };
      return Response.json({ code: 0, data });
    }));

    const rows = await readTable({ appToken: 'app', tableId: 'tbl', appId: 'id', appSecret: 'secret' });
    expect(rows).toEqual([{ n: 1 }, { n: 2 }]);
    expect(requests.filter((url) => url.includes('/records'))).toEqual([
      expect.stringContaining('page_size=500'),
      expect.stringContaining('page_token=p2'),
    ]);
  });
});
