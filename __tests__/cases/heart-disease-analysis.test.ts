/**
 * Case: heart disease dataset analysis.
 * Loads data/heart.csv via loadSource and runs demographic/health-metric queries
 * against the real LLM API.
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe.skipIf(skipLLMTests)('cases/heart-disease-analysis', () => {
  let ava: AVA;
  const dataPath = path.join(__dirname, '../../data/heart.csv');

  beforeEach(async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({ type: 'csv-file', options: { path: dataPath } });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('answers average age of patients', async () => {
    const result = await ava.analysis('What is the average age of patients?');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers heart disease count by gender', async () => {
    const result = await ava.analysis('How many patients with heart disease by gender?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers heart disease prevalence percentage', async () => {
    const result = await ava.analysis('What percentage of patients have heart disease?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers average cholesterol for heart disease patients', async () => {
    const result = await ava.analysis(
      'What is the average cholesterol level for patients with heart disease?'
    );
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);
});
