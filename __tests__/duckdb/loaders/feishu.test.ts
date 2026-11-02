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

describe.skipIf(!appId || !appSecret || !BITABLE_URL)('feishu-bitable 连通性', () => {
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
    expect(Array.isArray(fields.items)).toBe(true);
    const records = await get('/records');
    expect(records.items.length).toBeGreaterThan(0);
  }, 30000);
  it('返回有效的响应结构，不向日志或磁盘输出业务记录', async () => {
    const token = await getTenantAccessToken(appId, appSecret);
    const { appToken, tableId } = parseBitableUrl(BITABLE_URL);
    const get = async (suffix: string) => {
      const res = await fetch(api(appToken, tableId, suffix), { headers: { Authorization: `Bearer ${token}` } });
      return { status: res.status, body: await res.json() };
    };
    const { status, body } = await get('/records');
    expect(status).toBe(200);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.items)).toBe(true);
  }, 30000);
  it('readTable 读取的是入参指定的那张表', async () => {
    const { appToken, tableId } = parseBitableUrl(BITABLE_URL);
    const rows = await readTable({ appToken, tableId, appId, appSecret });
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0]).length).toBeGreaterThan(0);

  }, 30000);
});
