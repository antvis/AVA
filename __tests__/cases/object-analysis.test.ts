/**
 * Case: JSON object analysis.
 * Loads an in-memory object array via loadSource({ type: 'json' }) and runs
 * queries against the real LLM API.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src/ava';
import { getLLMConfig, skipLLMTests } from '../test-utils';

const CITY_DATA = [
  { city: '杭州', population: 1220, gdp: 18753 },
  { city: '上海', population: 2489, gdp: 43214 },
  { city: '北京', population: 2189, gdp: 40269 },
  { city: '深圳', population: 1768, gdp: 32387 },
  { city: '广州', population: 1868, gdp: 28839 },
];

describe.skipIf(skipLLMTests)('cases/object-analysis', () => {
  let ava: AVA;

  beforeEach(async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({ type: 'json', options: { data: CITY_DATA } });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('answers which city has the highest GDP', async () => {
    const result = await ava.analysis('Which city has the highest GDP?');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers average population of the cities', async () => {
    const result = await ava.analysis('What is the average population of these cities?');
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);

  it('answers sorting cities by GDP per capita', async () => {
    const result = await ava.analysis(
      'Sort cities by GDP per capita, calculated as GDP divided by population'
    );
    expect(typeof result.text).toBe('string');
    expect(result.data).toBeDefined();
  }, 60000);
});
