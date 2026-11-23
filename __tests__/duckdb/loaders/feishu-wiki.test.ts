import { afterEach, describe, expect, it, vi } from 'vitest';

import { feishuRequest } from '../../../src/duckdb/loaders/feishu/api';
import { readFeishuBase } from '../../../src/duckdb/loaders/feishu/read';
import { resolveBitable } from '../../../src/duckdb/loaders/feishu/resolve';

import { mockFeishu, salesBase } from './feishu-mock';

afterEach(() => vi.unstubAllGlobals());

const NODE = 'PdX7wzIVfiZKy4kSFSJcGa3anAV';
const wikiUrl = `https://my.feishu.cn/wiki/${NODE}?table=tblProducts&view=vew1`;
const app = { appId: 'id', appSecret: 'secret' };
const api = { token: 't', origin: 'https://open.feishu.cn' };

function wikiBase(node: unknown) {
  return { ...salesBase(), wiki: { [NODE]: node } };
}

const bitableNode = { obj_token: 'bascnSalesDemo0000000000', obj_type: 'bitable', title: '销售管理示例' };

describe('wiki-hosted Bitable', () => {
  it('resolves a wiki node token to the Bitable it hosts', async () => {
    const { requests } = mockFeishu(wikiBase(bitableNode));

    const base = await readFeishuBase({ url: wikiUrl, ...app });

    expect(base.tables.map((table) => table.name)).toEqual(['商品']);
    const paths = requests.map((request) => request.url.pathname + request.url.search);
    expect(paths).toContainEqual(`/open-apis/wiki/v2/spaces/get_node?token=${NODE}&obj_type=wiki`);
    // The Bitable APIs must use the resolved app token, never the wiki node token.
    expect(paths.some((path) => path.includes(`apps/${NODE}`))).toBe(false);
  });

  it('loads every table when the wiki link omits ?table=', async () => {
    mockFeishu(wikiBase(bitableNode));

    const base = await readFeishuBase({ url: `https://my.feishu.cn/wiki/${NODE}`, ...app });

    expect(base.single).toBe(false);
    expect(base.tables.map((table) => table.name)).toEqual(['客户', '商品', '订单']);
  });

  it('rejects a wiki node that hosts something other than a Bitable', async () => {
    mockFeishu(wikiBase({ obj_token: 'doccn123', obj_type: 'docx' }));

    await expect(readFeishuBase({ url: wikiUrl, ...app })).rejects.toThrow('hosts a docx, not a Bitable');
  });

  it('passes through the wiki API error without adding permission advice', async () => {
    mockFeishu(salesBase());

    await expect(readFeishuBase({ url: wikiUrl, ...app })).rejects.toEqual(new Error('Feishu Error 131005: not found'));
  });

  it('reports a wiki node that no longer points at a document', async () => {
    mockFeishu(wikiBase({ obj_type: 'bitable' }));

    await expect(readFeishuBase({ url: wikiUrl, ...app })).rejects.toThrow('does not point at a document');
  });
});

describe('error messages', () => {
  it('rethrows the original transport error without the request URL', async () => {
    vi.useFakeTimers();
    try {
      const failure = Object.assign(new Error('upstream token=original-secret'), { code: 'ECONNRESET' });
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
      const request = feishuRequest({ token: 'header-secret', origin: 'https://example.com' }, '/api', {
        query: { token: 'url-secret' },
      });
      const rejected = expect(request).rejects.toBe(failure);
      await vi.runAllTimersAsync();
      await rejected;
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not echo source URLs or tokens in its own validation errors', async () => {
    const signed = 'https://user:url-password@my.feishu.cn';
    for (const options of [
      { url: `${signed}/unsupported?signature=url-signature` },
      { url: `${signed}/base/link-secret?signature=url-signature&table=tbl123`, appToken: 'other' },
      { url: `${signed}/base/link-secret?table=tbl123`, tableId: 'tbl999' },
    ]) {
      await expect(resolveBitable(options, api)).rejects.toHaveProperty(
        'message',
        expect.not.stringMatching(/url-password|url-signature|link-secret/)
      );
    }
    mockFeishu({ app: { app_token: 'link-secret', name: 'empty' }, tables: [] });
    await expect(readFeishuBase({ url: `${signed}/base/link-secret`, ...app })).rejects.toEqual(
      new Error('Feishu Bitable has no tables.')
    );
  });
});

describe('resolveBitable', () => {
  it('keeps rejecting an appToken or tableId that disagrees with the link', async () => {
    mockFeishu(wikiBase(bitableNode));

    await expect(resolveBitable({ url: wikiUrl, appToken: 'other' }, api)).rejects.toThrow(
      'appToken does not match the wiki node'
    );
    await expect(resolveBitable({ url: wikiUrl, tableId: 'tbl999' }, api)).rejects.toThrow(
      'tableId does not match url'
    );
    await expect(
      resolveBitable({ url: 'https://my.feishu.cn/base/appToken123', appToken: 'other' }, api)
    ).rejects.toThrow('appToken does not match url');
  });

  it('reads the table from the link or the options', async () => {
    await expect(resolveBitable({ url: 'https://my.feishu.cn/base/appToken123' }, api)).resolves.toEqual({
      appToken: 'appToken123',
      tableId: undefined,
    });
    await expect(resolveBitable({ appToken: 'appToken123', tableId: 'tbl1' }, api)).resolves.toEqual({
      appToken: 'appToken123',
      tableId: 'tbl1',
    });
    await expect(resolveBitable({ tableId: 'tbl1' }, api)).rejects.toThrow('url or appToken must be provided');
    await expect(resolveBitable({ url: 'https://my.feishu.cn/docx/doc1' }, api)).rejects.toThrow(
      'Invalid Feishu Bitable URL'
    );
  });
});
