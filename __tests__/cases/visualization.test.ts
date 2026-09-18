/**
 * Case: visualization.
 * Loads an object array via loadSource, runs a visualization-intent query,
 * then generates GPT-Vis HTML from the analysis result against the real LLM API.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src';
import { getLLMConfig, skipLLMTests } from '../test-utils';

const CITY_DATA = [
  { city: '杭州', population: 1220, gdp: 18753 },
  { city: '上海', population: 2489, gdp: 43214 },
  { city: '北京', population: 2189, gdp: 40269 },
  { city: '深圳', population: 1768, gdp: 32387 },
  { city: '广州', population: 1868, gdp: 28839 },
];

describe.skipIf(skipLLMTests)('cases/visualization', () => {
  let ava: AVA;

  beforeEach(async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({ type: 'json', options: { data: CITY_DATA } });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('generates chart HTML from a visualization-intent analysis', async () => {
    const analysis = await ava.analysis('Draw a bar chart of GDP for each city');
    expect(typeof analysis.text).toBe('string');

    const viz = await ava.visualize(analysis);
    expect(viz).not.toBeNull();
    expect(typeof viz!.chartType).toBe('string');
    expect(viz!.html).toContain('<!DOCTYPE html>');
    expect(typeof viz!.syntax).toBe('string');
  }, 120000);
});
