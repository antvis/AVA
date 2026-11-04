/**
 * Shared runner for the Feishu Bitable examples.
 *
 * It loads the source through the real `feishu-bitable` loader, then answers
 * the question either with `analyze()` (自然语言 -> SQL, needs OPENAI_API_KEY)
 * or with the equivalent SQL through `query()` (fully offline).
 */

import { AVA } from '../../src/index';

import { installFeishuMock, resolveFeishuTarget } from './mock';

export interface ExampleAnalysis {
  title: string;
  question: string;
  sql: string;
}

export async function runAnalysis({ title, question, sql }: ExampleAnalysis): Promise<void> {
  const target = resolveFeishuTarget();
  const restore = target.mode === 'mock' ? installFeishuMock() : () => {};
  const ava = new AVA({
    llm: {
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY ?? '',
    },
    engine: { type: 'duckdb' },
  });

  try {
    console.log(`\n# ${title}`);
    console.log(`数据源：${target.mode === 'mock' ? '离线 mock-table.json' : '真实飞书多维表格'} ${target.url}`);
    await ava.source({
      type: 'feishu-bitable',
      options: { url: target.url, appId: target.appId, appSecret: target.appSecret },
    });
    console.log(`问题：${question}`);

    if (process.env.OPENAI_API_KEY) {
      const result = await ava.analyze(question);
      console.log(`生成并执行的 SQL：\n${result.sql ?? '(engine did not report the SQL)'}`);
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log('未设置 OPENAI_API_KEY，改为直接执行等价 SQL（离线可复现）。');
      console.log(`等价 SQL：${sql.trim()}`);
      const result = await ava.query(sql);
      console.log(JSON.stringify(result.data, null, 2));
    }
  } finally {
    await ava.dispose();
    restore();
  }
}
