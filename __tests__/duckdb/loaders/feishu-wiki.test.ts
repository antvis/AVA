import { afterEach, describe, expect, it, vi } from 'vitest';

import { readTable } from '../../../src/duckdb/loaders/feishu/read';
import { resolveBitableTable } from '../../../src/duckdb/loaders/feishu/resolve';

afterEach(() => vi.unstubAllGlobals());

const wikiUrl = 'https://my.feishu.cn/wiki/PdX7wzIVfiZKy4kSFSJcGa3anAV?table=tbl123&view=vew1';
const api = { token: 't', origin: 'https://open.feishu.cn' };

interface Routes {
  node?: unknown;
  tables?: { table_id: string; name: string }[];
  fields?: unknown[];
  records?: unknown[];
}

function stubFetch(routes: Routes = {}) {
  const fetch = vi.fn(async (input: string | URL) => {
    const url = String(input);
    if (url.includes('tenant_access_token')) {
      return Response.json({ code: 0, tenant_access_token: 't' });
    }
    if (url.includes('/wiki/v2/spaces/get_node')) {
      return Response.json(
        routes.node ?? { code: 0, data: { node: { obj_token: 'appToken123', obj_type: 'bitable' } } }
      );
    }
    if (url.includes('/tables?page_size=')) {
      return Response.json({ code: 0, data: { items: routes.tables ?? [{ table_id: 'tbl123', name: '表1' }] } });
    }
    if (url.includes('/fields')) {
      return Response.json({ code: 0, data: { items: routes.fields ?? [{ field_name: 'n', type: 2 }] } });
    }
    return Response.json({ code: 0, data: { items: routes.records ?? [{ fields: { n: 1 } }], has_more: false } });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('wiki-hosted Bitable', () => {
  it('resolves a wiki node token to the Bitable it hosts', async () => {
    const fetch = stubFetch();

    await expect(readTable({ url: wikiUrl, appId: 'id', appSecret: 'secret' })).resolves.toEqual([{ n: 1 }]);

    const urls = fetch.mock.calls.map(([input]) => String(input));
    expect(urls).toContainEqual(expect.stringContaining('/wiki/v2/spaces/get_node?token=PdX7wzIVfiZKy4kSFSJcGa3anAV'));
    // The Bitable APIs must use the resolved app token, never the wiki node token.
    expect(urls).toContainEqual(
      expect.stringContaining('/open-apis/bitable/v1/apps/appToken123/tables/tbl123/records')
    );
    expect(urls.some((url) => url.includes('apps/PdX7wzIVfiZKy4kSFSJcGa3anAV'))).toBe(false);
  });

  it('uses the only table when the wiki link omits ?table=', async () => {
    const fetch = stubFetch({ tables: [{ table_id: 'tblOnly', name: '唯一表' }] });

    await readTable({
      url: 'https://my.feishu.cn/wiki/PdX7wzIVfiZKy4kSFSJcGa3anAV',
      appId: 'id',
      appSecret: 'secret',
    });

    expect(fetch.mock.calls.map(([input]) => String(input))).toContainEqual(
      expect.stringContaining('tables/tblOnly/records')
    );
  });

  it('lists the tables when the Bitable has more than one', async () => {
    stubFetch({
      tables: [
        { table_id: 'tbl1', name: '销售' },
        { table_id: 'tbl2', name: '库存' },
      ],
    });

    await expect(
      readTable({ url: 'https://my.feishu.cn/wiki/PdX7wzIVfiZKy4kSFSJcGa3anAV', appId: 'id', appSecret: 'secret' })
    ).rejects.toThrow('has 2 tables');
    await expect(
      readTable({ url: 'https://my.feishu.cn/wiki/PdX7wzIVfiZKy4kSFSJcGa3anAV', appId: 'id', appSecret: 'secret' })
    ).rejects.toThrow('销售 (tbl1), 库存 (tbl2)');
  });

  it('rejects a wiki node that hosts something other than a Bitable', async () => {
    stubFetch({ node: { code: 0, data: { node: { obj_token: 'doccn123', obj_type: 'docx' } } } });

    await expect(readTable({ url: wikiUrl, appId: 'id', appSecret: 'secret' })).rejects.toThrow(
      'hosts a docx, not a Bitable'
    );
  });

  it('explains the wiki space grant when the node cannot be resolved', async () => {
    stubFetch({ node: { code: 131006, msg: 'permission denied' } });

    const error = await readTable({ url: wikiUrl, appId: 'id', appSecret: 'secret' }).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('could not be resolved');
    expect((error as Error).message).toContain('131006');
    expect((error as Error).message).toContain('wiki space');
  });

  it('keeps rejecting an appToken that disagrees with the link', async () => {
    stubFetch();

    await expect(resolveBitableTable({ url: wikiUrl, appToken: 'other' }, api)).rejects.toThrow(
      'appToken does not match the wiki node'
    );
    await expect(resolveBitableTable({ url: wikiUrl, tableId: 'tbl999' }, api)).rejects.toThrow(
      'tableId does not match url'
    );
  });

  it('resolves /base/ links without ?table= through the same lookup', async () => {
    stubFetch({ tables: [{ table_id: 'tbl123', name: '表1' }] });

    await expect(resolveBitableTable({ url: 'https://my.feishu.cn/base/appToken123' }, api)).resolves.toEqual({
      appToken: 'appToken123',
      tableId: 'tbl123',
    });
  });

  it('reports a wiki node that no longer points at a document', async () => {
    stubFetch({ node: { code: 0, data: { node: { obj_type: 'bitable' } } } });

    await expect(readTable({ url: wikiUrl, appId: 'id', appSecret: 'secret' })).rejects.toThrow(
      'does not point at a document'
    );
  });
});
