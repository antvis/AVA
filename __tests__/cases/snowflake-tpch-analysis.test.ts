/**
 * Case: end-to-end natural-language analysis in Snowflake on the shared TPC-H sample
 * (SNOWFLAKE_SAMPLE_DATA.TPCH_SF1). The model writes the SQL and Snowflake runs it; the answers are
 * checked against the official TPC-H answer set for scale factor 1 (queries 1, 5 and 6), so the
 * expected values come from outside AVA. Requires a model key and AVA_SNOWFLAKE_TEST=1.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AVA } from '../../src';
import { snowflakeOptions } from '../remote/snowflake/options';
import { getLLMConfig, skipLLMTests } from '../test-utils';

type Row = Record<string, unknown>;

/** The row's values that read as finite numbers, whatever the model named the columns. */
function numbers(row: Row): number[] {
  return Object.values(row)
    .filter((value) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
    .map(Number)
    .filter(Number.isFinite);
}

/** Official answers are rounded to cents. */
function hasAmount(row: Row, expected: number): boolean {
  return numbers(row).some((value) => Math.abs(value - expected) <= 0.01);
}

function hasText(row: Row, expected: string): boolean {
  return Object.values(row).some((value) => String(value).trim() === expected);
}

describe.skipIf(skipLLMTests || process.env.AVA_SNOWFLAKE_TEST !== '1')('cases/snowflake-tpch-analysis', () => {
  let ava: AVA;

  /** These cases check rows against the official answers, so the model summary is skipped. */
  const analyze = (question: string) => ava.analyze(question, { includeSummary: false });

  beforeAll(async () => {
    ava = new AVA({ llm: getLLMConfig(), engine: { type: 'snowflake' } });
    await ava.source({
      type: 'snowflake',
      options: snowflakeOptions({ database: 'SNOWFLAKE_SAMPLE_DATA', schema: 'TPCH_SF1', queryTimeoutMs: 120000 }),
    });
  }, 60000);

  afterAll(async () => {
    await ava?.dispose();
  });

  it('summarizes line items by return flag and status (TPC-H Q1)', async () => {
    const result = await analyze(
      '统计发货日期不晚于 1998-09-02 的订单明细，按退货标志和明细状态分组，给出数量合计、扩展价格合计、折后金额合计（扩展价格×(1-折扣)）、含税折后金额合计（扩展价格×(1-折扣)×(1+税率)）和明细行数，按退货标志、明细状态排序。'
    );
    const expected = [
      ['A', 'F', 37734107, 56586554400.73, 53758257134.87, 55909065222.83, 1478493],
      ['N', 'F', 991417, 1487504710.38, 1413082168.05, 1469649223.19, 38854],
      ['N', 'O', 74476040, 111701729697.74, 106118230307.61, 110367043872.5, 2920374],
      ['R', 'F', 37719753, 56568041380.9, 53741292684.6, 55889619119.83, 1478870],
    ] as const;

    expect(result.data).toHaveLength(4);
    expected.forEach(([flag, status, ...amounts], index) => {
      const row = result.data[index];
      expect(hasText(row, flag) && hasText(row, status), JSON.stringify(row)).toBe(true);
      for (const amount of amounts) expect(hasAmount(row, amount), `${amount} in ${JSON.stringify(row)}`).toBe(true);
    });
  }, 180000);

  it('ranks Asian nations by 1994 local-supplier revenue (TPC-H Q5)', async () => {
    const result = await analyze(
      '按国家统计亚洲地区在 1994 年下单的本地供应收入：只算客户和供应商属于同一个国家的订单明细，收入为扩展价格×(1-折扣)，按收入从高到低排序。'
    );
    const expected = [
      ['INDONESIA', 55502041.17],
      ['VIETNAM', 55295087.0],
      ['CHINA', 53724494.26],
      ['INDIA', 52035512.0],
      ['JAPAN', 45410175.7],
    ] as const;

    expect(result.data).toHaveLength(5);
    expected.forEach(([nation, revenue], index) => {
      const row = result.data[index];
      expect(hasText(row, nation) && hasAmount(row, revenue), JSON.stringify(row)).toBe(true);
    });
  }, 180000);

  it('computes the revenue change forecast (TPC-H Q6)', async () => {
    const result = await analyze(
      '对 1994 年全年发货、折扣在 0.05 到 0.07 之间（含两端）且数量小于 24 的订单明细，计算扩展价格乘以折扣的总和。'
    );

    expect(result.data).toHaveLength(1);
    expect(hasAmount(result.data[0], 123141078.23), JSON.stringify(result.data[0])).toBe(true);
  }, 180000);
});
