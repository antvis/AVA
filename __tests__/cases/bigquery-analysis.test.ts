/**
 * Case: natural-language analysis of public BigQuery datasets.
 * Each answer must equal the result of a hand-written query run against the same source.
 * Needs a model (OPENAI_API_KEY) and BigQuery access; see __tests__/datasets/bigquery/README.md.
 */
import { describe, expect, it } from 'vitest';

import { AVA } from '../../src';
import { getLLMConfig, skipLLMTests } from '../test-utils';

import type { BigQuerySourceOptions, ProfileOptions } from '../../src/types';

interface Case {
  source: BigQuerySourceOptions;
  /** Statistics computed before asking, so the model sees value formats. */
  profile?: ProfileOptions;
  question: string;
  sql: string;
}

/** Compare results independently of column names and row order; numbers are rounded to cents. */
function normalize(rows: Record<string, unknown>[]): string[] {
  return rows
    .map((row) =>
      Object.values(row)
        .map((value) => (typeof value === 'number' ? value.toFixed(2) : String(value)))
        .sort()
        .join(' | ')
    )
    .sort();
}

const projectId = process.env.AVA_BIGQUERY_PROJECT;
const THELOOK = {
  projectId,
  dataset: 'bigquery-public-data.thelook_ecommerce',
  tables: ['orders', 'order_items', 'products'],
};
// 92 daily `events_YYYYMMDD` shards, exposed as the wildcard model `events_*`.
const GA4 = { projectId, dataset: 'bigquery-public-data.ga4_obfuscated_sample_ecommerce' };

const CASES: Case[] = [
  {
    source: THELOOK,
    question: '每种订单状态各有多少个订单？',
    sql: 'SELECT status, COUNT(*) AS orders FROM orders GROUP BY status',
  },
  {
    source: THELOOK,
    question: '按商品类别统计订单明细的销售额（sale_price 之和），销售额最高的 5 个类别是哪些？',
    sql: `SELECT p.category, SUM(i.sale_price) AS sales
          FROM order_items AS i JOIN products AS p ON i.product_id = p.id
          GROUP BY p.category ORDER BY sales DESC LIMIT 5`,
  },
  {
    source: GA4,
    // Top values show that event_date is a YYYYMMDD string; from the schema alone the model may guess another format.
    profile: { metrics: [{ id: 'top_values', limit: 3 }] },
    question: '按 event_date 统计 2021 年 1 月每天的活跃用户数（user_pseudo_id 去重）',
    sql: `SELECT event_date, COUNT(DISTINCT user_pseudo_id) AS users
          FROM \`events_*\` WHERE _TABLE_SUFFIX BETWEEN '20210101' AND '20210131'
          GROUP BY event_date`,
  },
];

describe.skipIf(skipLLMTests || process.env.AVA_BIGQUERY_TEST !== '1')('cases/bigquery-analysis', () => {
  it.each(CASES)(
    'answers "$question" with the rows of the direct query',
    async ({ source, profile, question, sql }) => {
      const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'bigquery' } });
      try {
        await ava.source({ type: 'bigquery', options: source });
        if (profile) await ava.profile(profile);
        // The case checks the generated query against the direct one; the written summary is a separate,
        // engine-independent model step, so it is skipped.
        const answer = await ava.analyze(question, { includeSummary: false });
        const expected = await ava.query(sql);

        expect(answer.sql).toBeTruthy();
        expect(normalize(answer.data)).toEqual(normalize(expected.data));
      } finally {
        await ava.dispose();
      }
    },
    180000
  );
});
