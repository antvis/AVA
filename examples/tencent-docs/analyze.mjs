import assert from 'node:assert/strict';

import { AVA } from '../../lib/index.js';

const { TENCENT_DOCS_FILE_ID: fileId, TENCENT_DOCS_SHEET_ID: sheetId } = process.env;
if (!fileId || !sheetId) throw new Error('Set TENCENT_DOCS_FILE_ID and TENCENT_DOCS_SHEET_ID.');
const verifyOnly = process.argv.includes('--verify-only');
if (!verifyOnly && (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)) {
  throw new Error('Set OPENAI_API_KEY and OPENAI_MODEL, or pass --verify-only for deterministic SQL checks.');
}

const ava = new AVA({
  llm: {
    model: process.env.OPENAI_MODEL || 'offline-verification',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    maxRetries: 0,
  },
});
const scope =
  '只统计 data 中 文本 以 AVA-DEMO- 开头的虚构订单。文本是产品，数字是销售额，单选是地区，日期是订单时间；时间按 UTC 计算。';
const questions = [
  `${scope} 按地区统计订单数和销售额，按销售额从大到小排序。返回列名必须是 region、orders、sales。`,
  `${scope} 比较2026年1月和2月的总销售额，计算2月减1月的变化额和百分比变化（乘100，不附带百分号）。返回一行，列名必须是 jan_sales、feb_sales、change、change_pct。`,
];

try {
  await ava.source({ type: 'tencent-docs-smartsheet', options: { fileId, sheetId, pageSize: 2 } });
  const region = await ava.query(`SELECT "单选" AS region, count(*) AS orders, sum("数字") AS sales
    FROM data WHERE "文本" LIKE 'AVA-DEMO-%' GROUP BY "单选" ORDER BY sales DESC`);
  assert.deepEqual(region.data, [
    { region: '华西', orders: 4, sales: 550 },
    { region: '华东', orders: 4, sales: 350 },
  ]);
  const monthly = await ava.query(`SELECT strftime("日期" AT TIME ZONE 'UTC', '%Y-%m') AS month, sum("数字") AS sales
    FROM data WHERE "文本" LIKE 'AVA-DEMO-%' GROUP BY month ORDER BY month`);
  assert.deepEqual(monthly.data, [
    { month: '2026-01', sales: 500 },
    { month: '2026-02', sales: 400 },
  ]);
  console.log('PASS: source snapshot → DuckDB → deterministic business results (pageSize=2).');

  if (!verifyOnly) {
    for (const [index, question] of questions.entries()) {
      const result = await ava.analyze(question, { strategy: { type: 'direct', maxRetries: 1 } });
      if (index === 0) assert.deepEqual(result.data, region.data);
      else {
        assert.equal(result.data.length, 1);
        const row = result.data[0];
        assert.equal(Number(row.jan_sales), 500);
        assert.equal(Number(row.feb_sales), 400);
        assert.equal(Number(row.change), -100);
        assert.ok(Math.abs(Number(row.change_pct) - -20) < 1e-6);
      }
      console.log(`PASS: natural-language business example ${index + 1}`);
      console.log('SQL:', result.sql);
      console.table(result.data);
      console.log(result.text);
    }
  }
} catch {
  // Do not log provider errors, which can include request bodies or credentials.
  console.error('Verification failed. Check credentials, fixture completeness and the supported field contracts.');
  process.exitCode = 1;
} finally {
  await ava.dispose();
}
