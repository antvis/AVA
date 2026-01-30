/**
 * Integration tests for AVA main class
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../ava';

describe('AVA Integration Tests', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../../data/companies.csv');

  const apiKey = process.env.LING_1T_API_KEY;
  const skipLLMTests = !apiKey;

  beforeEach(() => {
    if (skipLLMTests) {
      // eslint-disable-next-line no-console
      console.log('Skipping LLM integration test: LING_1T_API_KEY not set');
      return;
    }

    ava = new AVA({
      llm: {
        model: 'Ling-1T',
        apiKey,
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      },
    });
  });

  afterEach(() => {
    if (ava) {
      ava.dispose();
    }
  });

  describe('Data Loading', () => {
    it('should load CSV file successfully', async () => {
      if (skipLLMTests) return;
      
      await ava.loadCSV(testDataPath);
      // If no error is thrown, the test passes
      expect(true).toBe(true);
    });

    it('should throw error when analyzing without loading data', async () => {
      if (skipLLMTests) return;
      
      await expect(ava.analysis('test query')).rejects.toThrow('No data loaded');
    });
  });

  describe('Analysis with Small Dataset (JavaScript)', () => {
    beforeEach(async () => {
      if (skipLLMTests) return;
      await ava.loadCSV(testDataPath);
    });

    it('should analyze and return summary for aggregation query', async () => {
      if (skipLLMTests) return;
      
      const result = await ava.analysis('What is the total revenue?');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }, 60000);

    it('should analyze and return summary for grouping query', async () => {
      if (skipLLMTests) return;
      
      const result = await ava.analysis('What is the average revenue by region?');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Result should mention regions
      expect(result.toLowerCase()).toMatch(/california|texas|new york/);
    }, 60000);

    it('should analyze and return summary for max value query', async () => {
      if (skipLLMTests) return;
      
      const result = await ava.analysis('What is the maximum revenue?');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('32400');
    }, 60000);

    it('should analyze and return summary for filtering query', async () => {
      if (skipLLMTests) return;
      
      const result = await ava.analysis('Show all companies in California');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.toLowerCase()).toContain('california');
    }, 60000);

    it('should analyze and return summary for sorting query', async () => {
      if (skipLLMTests) return;
      
      const result = await ava.analysis('Show top 3 companies by revenue');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Analysis with Large Dataset (SQLite)', () => {
    it('should use SQLite for large datasets', async () => {
      if (skipLLMTests) return;
      
      // Create AVA with very small threshold to force SQLite usage
      const avaLarge = new AVA({
        llm: {
          model: 'Ling-1T',
          apiKey,
          baseURL: 'https://api.tbox.cn/api/llm/v1',
        },
        sqlThreshold: 100, // Very small threshold
      });

      try {
        await avaLarge.loadCSV(testDataPath);
        const result = await avaLarge.analysis('What is the total count of companies?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).toContain('12');
      } finally {
        avaLarge.dispose();
      }
    }, 60000);

    it('should handle aggregation with SQLite', async () => {
      if (skipLLMTests) return;
      
      const avaLarge = new AVA({
        llm: {
          model: 'Ling-1T',
          apiKey,
          baseURL: 'https://api.tbox.cn/api/llm/v1',
        },
        sqlThreshold: 100,
      });

      try {
        await avaLarge.loadCSV(testDataPath);
        const result = await avaLarge.analysis('What is the average revenue by region?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      } finally {
        avaLarge.dispose();
      }
    }, 60000);
  });

  describe('Resource Cleanup', () => {
    it('should dispose resources properly', () => {
      if (skipLLMTests) return;
      
      const testAva = new AVA({
        llm: {
          model: 'Ling-1T',
          apiKey,
          baseURL: 'https://api.tbox.cn/api/llm/v1',
        },
      });

      testAva.dispose();
      // If no error is thrown, the test passes
      expect(true).toBe(true);
    });
  });
});
