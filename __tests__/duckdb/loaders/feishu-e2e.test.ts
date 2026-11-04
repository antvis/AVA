/**
 * End-to-end regression for the Feishu Bitable source:
 * URL -> tenant token -> field list -> paginated records (2 pages) -> cell
 * conversion -> DuckDB `data` view -> aggregate SQL.
 *
 * The Feishu HTTP layer is stubbed from `examples/feishu-bitable/mock-table.json`
 * (see that folder's README), so this runs offline and needs no tenant.
 * Both SQL statements come from the same module the runnable examples use, so
 * the test asserts exactly the analyses the examples publish.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SALES_MOM_SQL, STOCK_SHORTAGE_SQL } from '../../../examples/feishu-bitable/queries';
import {
  createFeishuMock,
  MOCK_BITABLE_URL,
  MOCK_CREDENTIALS,
  MOCK_TABLE,
} from '../../../examples/feishu-bitable/mock';
import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('feishu-bitable end-to-end (mock)', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
    vi.unstubAllGlobals();
  });

  it('loads every record page into the data view and answers the two example questions', async () => {
    const fetch = vi.fn(createFeishuMock());
    vi.stubGlobal('fetch', fetch);

    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'feishu-bitable', options: { url: MOCK_BITABLE_URL, ...MOCK_CREDENTIALS } });

    // 1. Pagination: the token call happened, and the loader followed page_token to page 2.
    const requests = fetch.mock.calls.map(([input]) => String(input));
    expect(requests.some((url) => url.includes('/auth/v3/tenant_access_token/internal'))).toBe(true);
    expect(requests.some((url) => url.includes('/fields'))).toBe(true);
    const recordRequests = requests.filter((url) => url.includes('/records'));
    expect(recordRequests).toHaveLength(2);
    expect(recordRequests[0]).toContain('page_size=500');
    expect(recordRequests[1]).toContain('page_token=5');

    // 2. Schema: supported fields only, and their DuckDB types.
    const schema = await engine.schema();
    expect(schema.models.map(({ name }) => name)).toEqual(['data']);
    expect(Object.fromEntries(schema.models[0].columns.map(({ name, type }) => [name, type]))).toEqual({
      区域: 'VARCHAR',
      月份: 'VARCHAR',
      商品: 'VARCHAR',
      销售额: 'BIGINT',
      库存: 'BIGINT',
      安全库存: 'BIGINT',
      负责人: 'VARCHAR',
      标签: 'VARCHAR',
      关联订单: 'VARCHAR',
      备注: 'VARCHAR',
    });

    // 3. Conversion: CJK text, user name, comma-joined multi-select and link IDs.
    const rows = await engine.execute('SELECT * FROM "data" ORDER BY "月份", "区域"');
    expect(rows.rowCount).toBe(MOCK_TABLE.records.length);
    expect(rows.data[0]).toEqual({
      区域: '华东',
      月份: '2026-01',
      商品: '智能音箱',
      销售额: 120000,
      库存: 120,
      安全库存: 100,
      负责人: '黄泡泡',
      标签: '重点,新品',
      关联订单: 'recOrder0001',
      备注: '华东大区重点客户',
    });
    // Type 24 (stage) is not a supported Bitable field, so it never becomes a column.
    expect(rows.data.every((row) => !('审批状态' in row))).toBe(true);

    // 4. Example 1: monthly sales per region, only the month-over-month declines.
    const declines = await engine.execute(SALES_MOM_SQL);
    expect(declines.data).toEqual([
      { 区域: '华东', 月份: '2026-03', 销售额: 110000, 上月销售额: 132000, 环比百分比: -16.67 },
      { 区域: '华北', 月份: '2026-02', 销售额: 86000, 上月销售额: 90000, 环比百分比: -4.44 },
    ]);

    // 5. Example 2: latest month, stock below the safety line, largest gap first.
    const shortages = await engine.execute(STOCK_SHORTAGE_SQL);
    expect(shortages.data).toEqual([
      { 区域: '华东', 商品: '智能音箱', 库存: 60, 安全库存: 100, 缺口: 40, 缺口百分比: 40 },
      { 区域: '华南', 商品: '空气净化器', 库存: 47, 安全库存: 80, 缺口: 33, 缺口百分比: 41.3 },
      { 区域: '华北', 商品: '扫地机器人', 库存: 18, 安全库存: 30, 缺口: 12, 缺口百分比: 40 },
    ]);
  });
});
