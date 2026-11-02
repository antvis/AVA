import { describe, expect, it } from 'vitest';

import { AVA } from '../../../src';

// Explicit opt-in: never spend a user's API quota as part of the default suite.
describe.skipIf(process.env.AVA_TENCENT_INTEGRATION !== '1')('Tencent Docs live read-only validation', () => {
  it('loads all pages and matches the eight seeded synthetic orders', async () => {
    const ava = new AVA({ llm: { model: 'offline-verification' } });
    try {
      await ava.source({
        type: 'tencent-smartsheet',
        options: {
          fileId: process.env.TENCENT_DOCS_FILE_ID!,
          sheetId: process.env.TENCENT_DOCS_SHEET_ID!,
          pageSize: 2,
        },
      });
      const result = await ava.query(`SELECT "单选" AS region, count(*) AS orders, sum("数字") AS sales
        FROM data WHERE "文本" LIKE 'AVA-DEMO-%' GROUP BY "单选" ORDER BY sales DESC`);
      expect(result.data).toEqual([
        { region: '华西', orders: 4, sales: 550 },
        { region: '华东', orders: 4, sales: 350 },
      ]);
    } finally {
      await ava.dispose();
    }
  }, 60000);
});
