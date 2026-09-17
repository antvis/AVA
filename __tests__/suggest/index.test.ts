/**
 * Tests for suggest functionality
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../../src/ava';
import { getLLMConfig, skipLLMTests } from '../test-utils';

// Every test below drives the LLM, so the whole suite is skipped without a key.
describe.skipIf(skipLLMTests)('suggest', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../../data/companies.csv');

  beforeEach(() => {
    ava = new AVA({ llm: getLLMConfig() });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  it('should throw when suggesting without loading data', async () => {
    await expect(ava.suggest()).rejects.toThrow('No data loaded');
  });

  it('should return scored suggestions after loading data', async () => {
    await ava.load({ type: 'csv-file', options: { path: testDataPath } });
    const suggestions = await ava.suggest();

    expect(suggestions.length).toBe(3);
    for (const s of suggestions) {
      expect(typeof s.query).toBe('string');
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
      expect(typeof s.reason).toBe('string');
    }
  }, 60000);
});
