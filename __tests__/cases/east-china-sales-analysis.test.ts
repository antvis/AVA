/* eslint-disable no-console */
// This case intentionally prints the analysis and chart for manual inspection.
import * as path from 'path';

import { expect, it } from 'vitest';

import { AVA } from '../../src';
import { getLLMConfig, skipLLMTests } from '../test-utils';

// Baseline for the future evidence chain: this exercises today's real analysis
// and visualization APIs, not evidence verification. Requires the configured LLM.
it.skipIf(skipLLMTests)('compares East China sales in July and August 2026', async () => {
  const ava = new AVA({ llm: getLLMConfig() });
  try {
    await ava.source({
      type: 'csv-file',
      options: {
        path: path.join(__dirname, '../datasets/east-china-sales.csv'),
        options: { types: { paid_at: 'TIMESTAMP', paid_amount: 'DECIMAL(18,2)' } },
      },
    });

    // Independent fixture check: Shanghai local timestamps, calendar months,
    // sum of paid_amount in CNY, ignoring null amounts.
    const baseline = await ava.query(`
      WITH monthly AS (
        SELECT
          SUM(paid_amount) FILTER (WHERE paid_at < TIMESTAMP '2026-08-01') AS july_sales,
          SUM(paid_amount) FILTER (WHERE paid_at >= TIMESTAMP '2026-08-01') AS august_sales
        FROM data
        WHERE region = '华东'
          AND paid_at >= TIMESTAMP '2026-07-01'
          AND paid_at < TIMESTAMP '2026-09-01'
      )
      SELECT july_sales, august_sales,
        august_sales - july_sales AS increase,
        (august_sales - july_sales) / july_sales AS growth_rate
      FROM monthly
    `);
    expect(baseline.data).toEqual([
      { july_sales: 100000, august_sales: 120000, increase: 20000, growth_rate: 0.2 },
    ]);

    const question = '华东地区 8 月销售额比 7 月增长了多少？';
    const result = await ava.analyze(
      `${question} 年份为 2026 年，paid_at 是 Asia/Shanghai 当地时间，按自然月统计。` +
        '销售额为 paid_amount 的合计，单位人民币元，忽略空值。' +
        '请同时给出两个月的销售额、增加金额和增长率，并用一句话总结。'
    );
    console.log('问题：', question);
    console.log('预期：华东地区 8 月销售额为 12 万元，7 月为 10 万元，增加 2 万元，增长 20%。');
    console.log('实际分析：', JSON.stringify(result, null, 2));
    expect(result.text.trim()).not.toBe('');
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.truncated).not.toBe(true);
    expect(result.sql).toBeTruthy();

    const chart = await ava.visualize({
      query: '用柱状图对比华东地区 2026 年 7 月和 8 月的销售额，单位人民币元；不绘制增量和增长率。',
      data: result.data,
    });
    // Print the actual chart specification; avoid dumping the HTML renderer.
    console.log('实际图表：', JSON.stringify(chart && { chartType: chart.chartType, syntax: chart.syntax }, null, 2));
    expect(chart).not.toBeNull();
    expect(chart?.syntax.trim()).not.toBe('');
    expect(chart?.html).toBeTruthy();
  } finally {
    await ava.dispose();
  }
}, 120000);
