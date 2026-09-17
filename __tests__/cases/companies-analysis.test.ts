/**
 * Case: companies dataset analysis.
 * Loads data/companies.csv via loadSource and runs aggregation/sorting queries
 * against the real LLM API.
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src/ava';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe.skipIf(skipLLMTests)('cases/companies-analysis', () => {
  let ava: AVA;
  const dataPath = path.join(__dirname, '../../data/companies.csv');

  beforeEach(async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({ type: 'csv-file', options: { path: dataPath } });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('answers max revenue by region', async () => {
    const result = await ava.analysis('What is the max revenue by region?');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
    expect(result.sql).toBeDefined();
  }, 60000);

  it('answers average revenue by region', async () => {
    const result = await ava.analysis('What is the average revenue by region?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers top 5 companies by revenue', async () => {
    const result = await ava.analysis('Show top 5 companies by revenue');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);
});
