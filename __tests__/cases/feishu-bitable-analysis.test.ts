/**
 * Case: natural-language analysis of a Feishu Bitable.
 *
 * The mock Open API serves the sales demo base (__tests__/datasets/feishu/sales.json:
 * 客户, 商品 and 订单 linked by duplex links); fetch is restored before the questions,
 * which go to the real LLM API. Expected answers are computed from the fixture.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../src';
import { mockFeishu, salesBase } from '../duckdb/loaders/feishu-mock';
import { getLLMConfig, skipLLMTests } from '../test-utils';

const fixture = salesBase();
const [customers, , orders] = fixture.tables;
const amount = (record: (typeof orders.records)[number]) => (record.fields['金额'] as { value: number[] }).value[0];
const beijingMonth = (ms: number) => new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 7);
const round = (value: number) => Math.round(value * 100) / 100;

/** Numbers anywhere in the result rows. */
function numbers(rows: Record<string, unknown>[]): number[] {
  return rows.flatMap((row) => Object.values(row).filter((value): value is number => typeof value === 'number'));
}

const near = (values: number[], expected: number) => values.some((value) => Math.abs(value - expected) < 0.01);

describe.skipIf(skipLLMTests)('cases/feishu-bitable-analysis', () => {
  let ava: AVA;

  beforeAll(async () => {
    mockFeishu(salesBase());
    ava = new AVA({ llm: getLLMConfig() });
    await ava.source({
      type: 'feishu-bitable',
      options: { url: `https://acme.feishu.cn/base/${fixture.app.app_token}`, appId: 'id', appSecret: 'secret' },
    });
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await ava?.dispose();
  });

  it('sums the orders of a month in the base time zone', async () => {
    const expected = round(
      orders.records
        .filter((record) => beijingMonth(record.fields['下单日期'] as number) === '2024-03')
        .reduce((sum, record) => sum + amount(record), 0)
    );

    const result = await ava.analyze('2024年3月的订单总金额是多少？');

    expect(near(numbers(result.data), expected), `${result.sql}\n${JSON.stringify(result.data)}`).toBe(true);
  }, 120000);

  it('joins orders to customers to total sales by city', async () => {
    const city = new Map(customers.records.map((record) => [record.record_id, record.fields['城市'] as string]));
    const expected = new Map<string, number>();
    for (const record of orders.records) {
      const name = city.get((record.fields['客户'] as { link_record_ids: string[] }).link_record_ids[0])!;
      expected.set(name, round((expected.get(name) ?? 0) + amount(record)));
    }

    const result = await ava.analyze('按客户所在城市统计订单总金额');

    for (const [name, total] of expected) {
      const row = result.data.find((item) => Object.values(item).includes(name));
      expect(row && near(numbers([row]), total), `${name}: ${result.sql}\n${JSON.stringify(result.data)}`).toBe(true);
    }
  }, 120000);

  it('counts unpaid orders, which Feishu stores as unchecked boxes', async () => {
    const expected = orders.records.filter((record) => record.fields['已付款'] !== true).length;

    const result = await ava.analyze('还有多少笔订单没有付款？');

    expect(near(numbers(result.data), expected), `${result.sql}\n${JSON.stringify(result.data)}`).toBe(true);
  }, 120000);

  it('filters a multi-select field by one option', async () => {
    const expected = orders.records.filter((record) => ((record.fields['标签'] as string[]) ?? []).includes('加急'));

    const result = await ava.analyze('标签包含“加急”的订单有多少笔，总金额是多少？');

    const values = numbers(result.data);
    expect(near(values, expected.length), `${result.sql}\n${JSON.stringify(result.data)}`).toBe(true);
    expect(near(values, round(expected.reduce((sum, record) => sum + amount(record), 0)))).toBe(true);
  }, 120000);
});
