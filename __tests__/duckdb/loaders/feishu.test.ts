/**
 * 飞书多维表格连通性诊断（不经过硬编码的 TEST_BITABLE_URL）。
 */

import { describe, it, expect } from 'vitest';

import { getTenantAccessToken } from '../../../src/duckdb/loaders/feishu/token';
import { parseBitableUrl } from '../../../src/duckdb/loaders/feishu/url';
import { readTable } from '../../../src/duckdb/loaders/feishu/read';

const BITABLE_URL = process.env.AVA_FEISHU_BITABLE_URL!;
const appId = process.env.AVA_FEISHU_APP_ID!;
const appSecret = process.env.AVA_FEISHU_APP_SECRET!;

const api = (appToken: string, tableId: string, suffix: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}${suffix}`;

describe.skipIf(!appId || !BITABLE_URL)('feishu-bitable 连通性', () => {
  it('能取到 token、字段和记录', async () => {
    const token = await getTenantAccessToken(appId, appSecret);
    const { appToken, tableId } = parseBitableUrl(BITABLE_URL);
    const get = async (suffix: string) => {
      const res = await fetch(api(appToken, tableId, suffix), { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      expect(body.code, `code=${body.code} msg=${body.msg}`).toBe(0);
      return body.data;
    };
    const fields = await get('/fields');
    console.log('字段:', fields.items.map((f: any) => `${f.type}:${f.field_name}`).join(' | '));
    const records = await get('/records');
    console.log('记录数:', records.items.length, 'total:', records.total, '示例:', JSON.stringify(records.items[0]?.fields));
    expect(records.items.length).toBeGreaterThan(0);
  }, 30000);
  it('dump 飞书原始返回内容', async () => {
    const token = await getTenantAccessToken(appId, appSecret);
    const { appToken, tableId } = parseBitableUrl(BITABLE_URL);
    const get = async (suffix: string) => {
      const res = await fetch(api(appToken, tableId, suffix), { headers: { Authorization: `Bearer ${token}` } });
      return { status: res.status, body: await res.json() };
    };
    const { status, body } = await get('/records');
    console.dir(body, { depth: null, colors: false });
    const { writeFileSync } = await import('node:fs');
    writeFileSync('/tmp/feishu-records.json', JSON.stringify(body, null, 2));
    console.log('HTTP:', status, '外层字段:', Object.keys(body).join(','), 'data 字段:', Object.keys(body.data).join(','));
    expect(status).toBe(200);
  }, 30000);
  it('readTable 读取的是入参指定的那张表', async () => {
    const { appToken, tableId } = parseBitableUrl(BITABLE_URL);
    const rows = await readTable({ appToken, tableId, appId, appSecret });
    console.log('行数:', rows.length, '第一行:', JSON.stringify(rows[0]));
    console.log('行数:', rows.length, '第二行:', JSON.stringify(rows[1]));
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0]).length).toBeGreaterThan(0);

  }, 30000);
});
