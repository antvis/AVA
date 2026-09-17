/**
 * Case: loan payments dataset analysis.
 * Loads data/loans_payments.csv via loadSource and runs loan-status/demographic
 * queries against the real LLM API.
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src/ava';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe.skipIf(skipLLMTests)('cases/loan-payments-analysis', () => {
  let ava: AVA;
  const dataPath = path.join(__dirname, '../../data/loans_payments.csv');

  beforeEach(async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({ type: 'csv-file', options: { path: dataPath } });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('answers loan status distribution', async () => {
    const result = await ava.analysis('What is the distribution of loan status?');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers average principal by education level', async () => {
    const result = await ava.analysis('What is the average principal by education level?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers loan count by gender', async () => {
    const result = await ava.analysis('How many loans by gender?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers average age of borrowers', async () => {
    const result = await ava.analysis('What is the average age of borrowers?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);
});
