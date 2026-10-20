import { afterEach, describe, expect, it, vi } from 'vitest';

import { readTable } from '../../../src/duckdb/loaders/feishu/read';

afterEach(() => vi.unstubAllGlobals());

describe('readTable pagination', () => {
  it('follows has_more and page_token until the last page', async () => {
    const requests: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        requests.push(url);
        if (url.includes('tenant_access_token')) return Response.json({ code: 0, tenant_access_token: 't' });
        if (url.includes('/fields')) return Response.json({ code: 0, data: { items: [{ field_name: 'n', type: 2 }] } });
        const data = url.includes('page_token=p2')
          ? { items: [{ fields: { n: 2 } }], has_more: false }
          : { items: [{ fields: { n: 1 } }], has_more: true, page_token: 'p2' };
        return Response.json({ code: 0, data });
      })
    );

    const rows = await readTable({ appToken: 'app', tableId: 'tbl', appId: 'id', appSecret: 'secret' });
    expect(rows).toEqual([{ n: 1 }, { n: 2 }]);
    expect(requests.filter((url) => url.includes('/records'))).toEqual([
      expect.stringContaining('page_size=500'),
      expect.stringContaining('page_token=p2'),
    ]);
  });

  it('keeps the newly supported field types and drops read-only ones', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.includes('tenant_access_token')) return Response.json({ code: 0, tenant_access_token: 't' });
        if (url.includes('/fields')) {
          return Response.json({
            code: 0,
            data: {
              items: [
                { field_name: '标题', type: 1 },
                { field_name: '负责人', type: 11 },
                { field_name: '附件', type: 17 },
                { field_name: '关联', type: 18 },
                { field_name: '地址', type: 22 },
                { field_name: '公式', type: 20 },
                { field_name: '流程', type: 24 },
                { field_name: '按钮', type: 3001 },
              ],
            },
          });
        }
        return Response.json({
          code: 0,
          data: {
            items: [
              {
                fields: {
                  标题: [{ text: '任务', type: 'text' }],
                  负责人: [{ id: 'ou_1', name: '黄泡泡' }],
                  附件: [{ name: 'a.png' }],
                  关联: { link_record_ids: ['rec1'] },
                  地址: { full_address: '北京市海淀区' },
                  公式: { type: 2, value: [3] },
                  流程: '进行中',
                  按钮: true,
                },
              },
            ],
            has_more: false,
          },
        });
      })
    );

    const rows = await readTable({ appToken: 'app', tableId: 'tbl', appId: 'id', appSecret: 'secret' });
    expect(rows).toEqual([
      { 标题: '任务', 负责人: '黄泡泡', 附件: 'a.png', 关联: 'rec1', 地址: '北京市海淀区', 公式: 3 },
    ]);
  });
});
