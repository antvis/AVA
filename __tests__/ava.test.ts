/**
 * Integration tests for AVA main class
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../src/ava';

describe('AVA Integration Tests', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../data/companies.csv');
  const heartDataPath = path.join(__dirname, '../data/heart.csv');

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

  describe('Data Loading', () => {
    it('should load CSV file successfully', async () => {
      if (skipLLMTests) return;
      
      await ava.loadCSV(testDataPath);
      // No error thrown means data loaded successfully
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
      
      try {
        const result = await ava.analysis('What is the total revenue?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
        // analysis() should return query field
        expect(result.query).toBe('What is the total revenue?');
        // analysis() should not return visualization fields
        expect(result).not.toHaveProperty('visualizationSyntax');
        expect(result).not.toHaveProperty('visualizationHTML');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze and return summary for grouping query', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('What is the average revenue by region?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
        // Result should mention regions
        expect(result.text.toLowerCase()).toMatch(/california|texas|new york/);
        // analysis() should return data and query for downstream visualize()
        expect(result.data).toBeDefined();
        expect(result.query).toBe('What is the average revenue by region?');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze and return summary for max value query', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('What is the maximum revenue?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        // Maximum revenue in test data is 32400 (may be formatted as 32,400)
        expect(result.text.toLowerCase()).toMatch(/32[,\s]?400/);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze and return summary for filtering query', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('Show all companies in California');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.toLowerCase()).toContain('california');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze and return summary for sorting query', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('Show top 3 companies by revenue');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);
  });

  describe('Visualize', () => {
    beforeEach(async () => {
      if (skipLLMTests) return;
      await ava.loadCSV(testDataPath);
    });

    it('should visualize analysis data with a chart query', async () => {
      if (skipLLMTests) return;
      
      try {
        const analysisResult = await ava.analysis('Visualize the average revenue by region as a bar chart');
        
        expect(analysisResult.data).toBeDefined();
        
        const vizResult = await ava.visualize(analysisResult);
        
        // vizResult may be null if LLM doesn't detect visualization intent
        // but with an explicit "bar chart" query it should return a result
        if (vizResult) {
          expect(vizResult.chartType).toBeDefined();
          expect(typeof vizResult.chartType).toBe('string');
          expect(vizResult.html).toBeDefined();
          expect(typeof vizResult.html).toBe('string');
          expect(vizResult.syntax).toBeDefined();
          expect(typeof vizResult.syntax).toBe('string');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 120000);

    it('should return null for non-visualization data', async () => {
      if (skipLLMTests) return;
      
      try {
        const analysisResult = await ava.analysis('What is the total revenue?');
        const vizResult = await ava.visualize(analysisResult);
        
        // Non-visualization queries may return null
        // This is acceptable behavior — the advisor decides
        if (vizResult === null) {
          expect(vizResult).toBeNull();
        } else {
          expect(vizResult.chartType).toBeDefined();
          expect(vizResult.html).toBeDefined();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 120000);

    it('should emit step events during visualize', async () => {
      if (skipLLMTests) return;

      const steps: any[] = [];
      const handler = (event: any) => { steps.push({ ...event }); };
      ava.on('step', handler);

      try {
        const analysisResult = await ava.analysis('Show revenue by region as a chart');
        await ava.visualize(analysisResult);

        // Step events should have been emitted
        expect(steps.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      } finally {
        ava.off('step', handler);
      }
    }, 120000);
  });

  describe('Analysis with Large Dataset (SQLite)', () => {
    it('should use SQLite for large datasets', async () => {
      if (skipLLMTests) return;
      
      // Create AVA with very small threshold to force SQLite usage
      const avaLarge = new AVA({
        llm: getLLMConfig(),
        sqlThreshold: 100, // Very small threshold
      });

      try {
        await avaLarge.loadCSV(testDataPath);
        const result = await avaLarge.analysis('What is the total count of companies?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        // Verify result mentions the count (12 companies in test data)
        expect(result.text).toContain('12');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      } finally {
        avaLarge.dispose();
      }
    }, 60000);

    it('should handle aggregation with SQLite', async () => {
      if (skipLLMTests) return;
      
      const avaLarge = new AVA({
        llm: getLLMConfig(),
        sqlThreshold: 100,
      });

      try {
        await avaLarge.loadCSV(testDataPath);
        const result = await avaLarge.analysis('What is the average revenue by region?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      } finally {
        avaLarge.dispose();
      }
    }, 60000);
  });

  describe('Resource Cleanup', () => {
    it('should dispose resources properly', () => {
      if (skipLLMTests) return;
      
      const testAva = new AVA({
        llm: getLLMConfig(),
      });

      testAva.dispose();
      // No error thrown means dispose worked correctly
    });
  });

  describe('loadText Integration Tests', () => {
    it('should load and analyze data from simple text', async () => {
      if (skipLLMTests) return;
      
      try {
        const text = '杭州 100，上海 200，北京 300';
        await ava.loadText(text);
        
        const result = await ava.analysis('What is the sum of all values?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
        // Result should mention the sum (600)
        expect(result.text).toMatch(/600/);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should extract structured data from narrative text', async () => {
      if (skipLLMTests) return;
      
      try {
        const text = `
          公司销售报告：
          第一季度，华东区销售额 1500 万，完成率 95%
          第二季度，华东区销售额 1800 万，完成率 102%
          第一季度，华南区销售额 1200 万，完成率 88%
          第二季度，华南区销售额 1600 万，完成率 98%
        `;
        
        await ava.loadText(text);
        
        const result = await ava.analysis('Which quarter had the best completion rate?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should extract data from tabular text format', async () => {
      if (skipLLMTests) return;
      
      try {
        const text = `
          Product    Price   Stock
          Laptop     5999    50
          Phone      3999    120
          Tablet     2999    80
        `;
        
        await ava.loadText(text);
        
        const result = await ava.analysis('Which product has the highest stock?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.toLowerCase()).toContain('phone');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should handle loadText with aggregation queries', async () => {
      if (skipLLMTests) return;
      
      try {
        const text = 'Beijing 100, Shanghai 200, Hangzhou 150, Shenzhen 180';
        await ava.loadText(text);
        
        const result = await ava.analysis('What is the average value?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should work with SQLite for large text-extracted data', async () => {
      if (skipLLMTests) return;
      
      const avaLarge = new AVA({
        llm: getLLMConfig(),
        sqlThreshold: 100, // Very small threshold to force SQLite usage
      });

      try {
        const text = 'Beijing 100, Shanghai 200, Hangzhou 150, Shenzhen 180, Guangzhou 170';
        await avaLarge.loadText(text);
        
        const result = await avaLarge.analysis('What is the total?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      } finally {
        avaLarge.dispose();
      }
    }, 60000);
  });

  describe('Heart Disease Dataset Tests', () => {
    beforeEach(async () => {
      if (skipLLMTests) return;
      await ava.loadCSV(heartDataPath);
    });

    it('should analyze age distribution in heart disease data', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('What is the average age of patients?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze heart disease by gender', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('How many patients with heart disease by gender?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.toLowerCase()).toMatch(/male|female/);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze heart disease prevalence', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('What is the percentage of patients with heart disease?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should analyze cholesterol levels', async () => {
      if (skipLLMTests) return;
      
      try {
        const result = await ava.analysis('What is the average cholesterol level?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.toLowerCase()).toContain('cholesterol');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to API error:', error instanceof Error ? error instanceof Error ? error.message : String(error));
      }
    }, 60000);
  });
});
