import assert from 'node:assert/strict';

import { AVA } from '../../lib/index.js';

const { NOTION_DATABASE_ID: databaseId } = process.env;
if (!databaseId) throw new Error('Set NOTION_DATABASE_ID.');
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
  '只统计 data 中 名称 以 AVA-DEMO- 开头的虚构任务。名称是任务标题，金额是估算，状态是任务状态，日期是截止时间；时间按 UTC 计算。';
const questions = [
  `${scope} 按状态统计每个状态的任务数量和金额总和，按金额总和从大到小排序。返回列名必须是 status、tasks、total。`,
  `${scope} 按月份统计任务数量和金额总和，按月份升序排列。返回列名必须是 month、tasks、total。`,
];

try {
  await ava.source({ type: 'notion', options: { databaseId, pageSize: 2 } });
  const byStatus = await ava.query(`SELECT "状态" AS status, count(*) AS tasks, sum("金额") AS total
    FROM data WHERE "名称" LIKE 'AVA-DEMO-%' GROUP BY status ORDER BY total DESC`);
  assert.deepEqual(byStatus.data, [
    { status: '已完成', tasks: 3, total: 380 },
    { status: '进行中', tasks: 3, total: 330 },
  ]);
  const byMonth = await ava.query(`SELECT strftime(CAST("日期" AS TIMESTAMPTZ), '%Y-%m') AS month, count(*) AS tasks, sum("金额") AS total
    FROM data WHERE "名称" LIKE 'AVA-DEMO-%' GROUP BY month ORDER BY month`);
  assert.deepEqual(byMonth.data, [
    { month: '2026-01', tasks: 3, total: 400 },
    { month: '2026-02', tasks: 3, total: 310 },
  ]);
  console.log('PASS: source snapshot → DuckDB → deterministic business results (pageSize=2).');

  if (!verifyOnly) {
    for (const [index, question] of questions.entries()) {
      const result = await ava.analyze(question, { strategy: { type: 'direct', maxRetries: 1 } });
      if (index === 0) assert.deepEqual(result.data, byStatus.data);
      else assert.deepEqual(result.data, byMonth.data);
      console.log(`PASS: natural-language business example ${index + 1}`);
      console.log('SQL:', result.sql);
      console.table(result.data);
      console.log(result.text);
    }
  }
} catch {
  // Do not log provider errors, which can include request bodies or credentials.
  console.error('Verification failed. Check credentials, fixture completeness and the supported property contracts.');
  process.exitCode = 1;
} finally {
  await ava.dispose();
}