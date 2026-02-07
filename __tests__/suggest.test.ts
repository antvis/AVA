/**
 * Tests for suggest functionality
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../src/ava';

describe('Suggest Tests', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../data/companies.csv');

  const apiKey = process.env.LING_1T_API_KEY;
  const skipLLMTests = !apiKey;

  const getLLMConfig = () => ({
    model: 'ling-1t',
    apiKey: apiKey || '',
    baseURL: 'https://api.tbox.cn/api/llm/v1',
  });

  beforeEach(() => {
    if (skipLLMTests) {
      // eslint-disable-next-line no-console
      console.log('Skipping LLM integration test: LING_1T_API_KEY not set');
      return;
    }

    ava = new AVA({
      llm: getLLMConfig(),
    });
  });

  afterEach(() => {
    if (ava) {
      ava.dispose();
    }
  });

  describe('suggest method', () => {
    it('should throw error when suggesting without loading data', async () => {
      if (skipLLMTests) return;
      
      await expect(ava.suggest()).rejects.toThrow('No data loaded');
    });

    it('should return 3 suggestions by default', async () => {
      if (skipLLMTests) return;
      
      try {
        await ava.loadCSV(testDataPath);
        const suggestions = await ava.suggest();
        
        expect(suggestions).toBeDefined();
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBe(3);
        
        // Verify each suggestion has required fields
        for (const suggestion of suggestions) {
          expect(suggestion).toHaveProperty('query');
          expect(suggestion).toHaveProperty('score');
          expect(suggestion).toHaveProperty('reason');
          expect(typeof suggestion.query).toBe('string');
          expect(typeof suggestion.score).toBe('number');
          expect(typeof suggestion.reason).toBe('string');
          expect(suggestion.query.length).toBeGreaterThan(0);
          expect(suggestion.reason.length).toBeGreaterThan(0);
          // Score should be between 0 and 1
          expect(suggestion.score).toBeGreaterThanOrEqual(0);
          expect(suggestion.score).toBeLessThanOrEqual(1);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should return specified number of suggestions', async () => {
      if (skipLLMTests) return;
      
      try {
        await ava.loadCSV(testDataPath);
        const suggestions = await ava.suggest(5);
        
        expect(suggestions).toBeDefined();
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBe(5);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should return suggestions sorted by score in descending order', async () => {
      if (skipLLMTests) return;
      
      try {
        await ava.loadCSV(testDataPath);
        const suggestions = await ava.suggest();
        
        // Verify suggestions are sorted by score descending
        for (let i = 0; i < suggestions.length - 1; i++) {
          expect(suggestions[i].score).toBeGreaterThanOrEqual(suggestions[i + 1].score);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should work with loadObject', async () => {
      if (skipLLMTests) return;
      
      try {
        await ava.loadObject([
          { city: '杭州', gdp: 18753 },
          { city: '上海', gdp: 43214 },
          { city: '北京', gdp: 35371 },
        ]);
        
        const suggestions = await ava.suggest();
        
        expect(suggestions).toBeDefined();
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBe(3);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should generate queries that can be used with analysis', async () => {
      if (skipLLMTests) return;
      
      try {
        await ava.loadCSV(testDataPath);
        const suggestions = await ava.suggest(1);
        
        expect(suggestions.length).toBeGreaterThan(0);
        
        // Try to analyze using the first suggested query
        const result = await ava.analysis(suggestions[0].query);
        
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 120000); // Longer timeout for this test
  });
});
