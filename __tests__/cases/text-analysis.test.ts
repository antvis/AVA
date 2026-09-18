/**
 * Case: text data analysis.
 * Extracts structured data from unstructured text via loadSource({ type: 'text' })
 * and runs queries against the real LLM API.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe.skipIf(skipLLMTests)('cases/text-analysis', () => {
  let ava: AVA;

  beforeEach(() => {
    ava = new AVA({ llm: getLLMConfig() });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('extracts simple comma-separated text and sums values', async () => {
    await ava.load({ type: 'text', options: { text: '杭州 100，上海 200，北京 300' } });

    const result = await ava.analysis('What is the sum of all values?');
    expect(typeof result.text).toBe('string');
    expect(result.text).toMatch(/600/);
  }, 90000);

  it('extracts narrative text and finds the best completion rate', async () => {
    const text = `
      公司销售报告：
      第一季度，华东区销售额 1500 万，完成率 95%
      第二季度，华东区销售额 1800 万，完成率 102%
      第一季度，华南区销售额 1200 万，完成率 88%
      第二季度，华南区销售额 1600 万，完成率 98%
    `;
    await ava.load({ type: 'text', options: { text } });

    const result = await ava.analysis('Which region and quarter had the best completion rate?');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  }, 90000);

  it('extracts tabular text and computes total inventory value', async () => {
    const text = `
      Product    Price   Stock
      Laptop     5999    50
      Phone      3999    120
      Tablet     2999    80
      Watch      1999    200
    `;
    await ava.load({ type: 'text', options: { text } });

    const result = await ava.analysis(
      'Calculate the total inventory value (price times stock for each product)'
    );
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 90000);
});
