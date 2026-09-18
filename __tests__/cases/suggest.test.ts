/**
 * Case: query suggestions.
 * Loads an object array via loadSource, then exercises the suggest() API and
 * runs the top suggested query through analysis() against the real LLM API.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src';
import { getLLMConfig, skipLLMTests } from '../test-utils';

const CITY_DATA = [
  { city: '杭州', gdp: 18753, population: 1220 },
  { city: '上海', gdp: 43214, population: 2489 },
  { city: '北京', gdp: 35371, population: 2188 },
  { city: '深圳', gdp: 30664, population: 1768 },
  { city: '广州', gdp: 28839, population: 1868 },
];

describe.skipIf(skipLLMTests)('cases/suggest', () => {
  let ava: AVA;

  beforeEach(async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({ type: 'json', options: { data: CITY_DATA } });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('returns scored suggestions and analyzes the top one', async () => {
    const suggestions = await ava.suggest(5);

    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);
    for (const s of suggestions) {
      expect(typeof s.query).toBe('string');
      expect(typeof s.score).toBe('number');
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
      expect(typeof s.reason).toBe('string');
    }

    // The top suggested query should be analyzable
    const result = await ava.analysis(suggestions[0].query);
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  }, 120000);
});
