/**
 * Live Feishu Open API check, skipped unless AVA_FEISHU_BITABLE_URL, AVA_FEISHU_APP_ID
 * and AVA_FEISHU_APP_SECRET are configured.
 */

import { describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { sqlIdentifier } from '../../../src/util/sql';

const url = process.env.AVA_FEISHU_BITABLE_URL;
const appId = process.env.AVA_FEISHU_APP_ID;
const appSecret = process.env.AVA_FEISHU_APP_SECRET;
const credentials = appId && appSecret ? { appId, appSecret } : undefined;

describe.skipIf(!url || !credentials)('feishu-bitable live API', () => {
  it('loads the configured Bitable with one row per record', async () => {
    const ava = new AVA({ llm: { model: 'no-model-call' } });
    try {
      await ava.source({ type: 'feishu-bitable', options: { url, ...credentials } });
      const schema = await ava.schema();
      expect(schema.models.length).toBeGreaterThan(0);
      for (const model of schema.models) {
        expect(model.primaryKey).toBeDefined();
        const key = sqlIdentifier(String(model.primaryKey));
        const result = await ava.query(
          `SELECT COUNT(*) AS rows, COUNT(DISTINCT ${key}) AS records FROM ${sqlIdentifier(model.name)}`
        );
        expect(result.data[0].rows).toBe(result.data[0].records);
      }
    } finally {
      await ava.dispose();
    }
  }, 120_000);
});
