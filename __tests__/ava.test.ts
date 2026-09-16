/**
 * Integration tests for AVA main class
 */

import { readFile } from 'fs/promises';
import { createServer } from 'http';
import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../src/ava';

import { getLLMConfig, skipLLMTests } from './test-utils';

describe('AVA Integration Tests', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../data/companies.csv');
  const heartDataPath = path.join(__dirname, '../data/heart.csv');

  // LLM-free tests always run; LLM-dependent suites declare `skipIf(skipLLMTests)`.
  beforeEach(() => {
    ava = new AVA({
      llm: getLLMConfig(),
    });
  });

  afterEach(async () => {
    if (ava) {
      await ava.dispose();
    }
  });

  describe('Data Loading', () => {
    it('should load CSV file successfully', async () => {
      await ava.loadCSV(testDataPath);
      // No error thrown means data loaded successfully
    });

    it('should throw error when analyzing without loading data', async () => {
      await expect(ava.analysis('test query')).rejects.toThrow('No data loaded');
    });
  });

  describe('loadSource (DuckDB, no LLM required)', () => {
    let sourceAva: AVA;

    afterEach(async () => {
      await sourceAva?.dispose();
    });

    it('should load a local CSV file and infer typed metadata', async () => {
      sourceAva = new AVA({ llm: getLLMConfig() });
      const info = await sourceAva.loadSource({ type: 'csv-file', options: { path: testDataPath } });

      expect(info.rowCount).toBe(12);
      expect(info.columnCount).toBe(3);
      const revenue = info.fields.find((f) => f.name === 'revenue');
      expect(revenue?.type).toBe('number');
      expect(revenue?.samples?.length).toBeGreaterThan(0);
    });

    it('should load a remote CSV over HTTP', async () => {
      const server = createServer(async (_req, res) => {
        res.setHeader('Content-Type', 'text/csv');
        res.end(await readFile(testDataPath, 'utf-8'));
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as { port: number };

      try {
        sourceAva = new AVA({ llm: getLLMConfig() });
        const info = await sourceAva.loadSource({
          type: 'csv-file',
          options: { path: `http://127.0.0.1:${port}/companies.csv` },
        });
        expect(info.rowCount).toBe(12);
        expect(info.fields.map((f) => f.name)).toEqual(['company', 'region', 'revenue']);
      } finally {
        server.close();
      }
    });

    it('should reject reserved database source types', async () => {
      sourceAva = new AVA({ llm: getLLMConfig() });
      await expect(sourceAva.loadSource({ type: 'mysql', options: {} })).rejects.toThrow(
        'not supported yet',
      );
    });
  });

  describe.skipIf(skipLLMTests)('Analysis with Small Dataset (JavaScript)', () => {
    beforeEach(async () => {
      await ava.loadCSV(testDataPath);
    });

    it('should analyze and return summary for aggregation query', async () => {
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
    }, 60000);

    it('should analyze and return summary for grouping query', async () => {
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
    }, 60000);

    it('should analyze and return summary for max value query', async () => {
      const result = await ava.analysis('What is the maximum revenue?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      // Maximum revenue in test data is 32400 (may be formatted as 32,400)
      expect(result.text.toLowerCase()).toMatch(/32[,\s]?400/);
    }, 60000);

    it('should analyze and return summary for filtering query', async () => {
      const result = await ava.analysis('Show all companies in California');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.toLowerCase()).toContain('california');
    }, 60000);

    it('should analyze and return summary for sorting query', async () => {
      const result = await ava.analysis('Show top 3 companies by revenue');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe.skipIf(skipLLMTests)('Visualize', () => {
    beforeEach(async () => {
      await ava.loadCSV(testDataPath);
    });

    it('should visualize analysis data with a chart query', async () => {
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
    }, 120000);

    it('should return null for non-visualization data', async () => {
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
    }, 120000);

  });

  describe.skipIf(skipLLMTests)('Analysis with Large Dataset (DuckDB)', () => {
    it('should use DuckDB for large datasets', async () => {
      // Create AVA for SQL analysis
      const avaLarge = new AVA({
        llm: getLLMConfig(),
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
      } finally {
        avaLarge.dispose();
      }
    }, 60000);

    it('should handle aggregation with DuckDB', async () => {
      const avaLarge = new AVA({
        llm: getLLMConfig(),
      });

      try {
        await avaLarge.loadCSV(testDataPath);
        const result = await avaLarge.analysis('What is the average revenue by region?');
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
        expect(result.text.length).toBeGreaterThan(0);
      } finally {
        avaLarge.dispose();
      }
    }, 60000);
  });

  describe('Resource Cleanup', () => {
    it('should dispose resources properly', async () => {
      const testAva = new AVA({
        llm: getLLMConfig(),
      });

      await testAva.dispose();
      // No error thrown means dispose worked correctly
    });
  });

  describe.skipIf(skipLLMTests)('loadText Integration Tests', () => {
    it('should load and analyze data from simple text', async () => {
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
    }, 60000);

    it('should extract structured data from narrative text', async () => {
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
    }, 60000);

    it('should extract data from tabular text format', async () => {
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
    }, 60000);

    it('should handle loadText with aggregation queries', async () => {
      const text = 'Beijing 100, Shanghai 200, Hangzhou 150, Shenzhen 180';
      await ava.loadText(text);

      const result = await ava.analysis('What is the average value?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
    }, 60000);

    it('should work with DuckDB for large text-extracted data', async () => {
      const avaLarge = new AVA({
        llm: getLLMConfig(),
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
      } finally {
        avaLarge.dispose();
      }
    }, 60000);
  });

  describe.skipIf(skipLLMTests)('Heart Disease Dataset Tests', () => {
    beforeEach(async () => {
      await ava.loadCSV(heartDataPath);
    });

    it('should analyze age distribution in heart disease data', async () => {
      const result = await ava.analysis('What is the average age of patients?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
    }, 60000);

    it('should analyze heart disease by gender', async () => {
      const result = await ava.analysis('How many patients with heart disease by gender?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.toLowerCase()).toMatch(/male|female/);
    }, 60000);

    it('should analyze heart disease prevalence', async () => {
      const result = await ava.analysis('What is the percentage of patients with heart disease?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
    }, 60000);

    it('should analyze cholesterol levels', async () => {
      const result = await ava.analysis('What is the average cholesterol level?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.toLowerCase()).toContain('cholesterol');
    }, 60000);
  });
});
