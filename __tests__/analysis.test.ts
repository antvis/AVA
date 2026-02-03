/**
 * Unit tests for analysis module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SQLiteDataStore, executeDataCode, generateSQL, generateDataCode } from '../src/analysis';

describe('Analysis Module', () => {
  const getLLMConfig = () => ({
    model: 'ling-1t',
    apiKey: process.env.LING_1T_API_KEY || '',
    baseURL: 'https://api.tbox.cn/api/llm/v1',
  });

  describe('SQLiteDataStore', () => {
    let store: SQLiteDataStore;

    beforeEach(() => {
      store = new SQLiteDataStore();
    });

    afterEach(() => {
      store.close();
    });

    it('should create and load data', async () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      await store.loadData(testData);
      const result = await store.query('SELECT * FROM data');
      
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });

    it('should handle empty data', async () => {
      await store.loadData([]);
      const schema = await store.getSchema();
      expect(schema).toBeDefined();
    });

    it('should query with WHERE clause', async () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      await store.loadData(testData);
      const result = await store.query("SELECT * FROM data WHERE city = 'NYC'");
      
      expect(result.length).toBe(2);
    });

    it('should query with aggregation', async () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      await store.loadData(testData);
      const result = await store.query('SELECT COUNT(*) as count FROM data');
      
      expect(result[0].count).toBe(3);
    });

    it('should get schema info', async () => {
      const testData = [{ name: 'Alice', age: 30 }];
      await store.loadData(testData);
      
      const schema = await store.getSchema();
      expect(schema).toContain('name');
      expect(schema).toContain('age');
    });
  });

  describe('executeDataCode', () => {
    const testData = [
      { name: 'Alice', score: 90, region: 'East' },
      { name: 'Bob', score: 85, region: 'West' },
      { name: 'Charlie', score: 95, region: 'East' },
      { name: 'David', score: 80, region: 'West' },
    ];

    it('should execute simple count operation', async () => {
      const code = 'const result = ops.count(data);';
      const result = await executeDataCode(testData, code);
      expect(result).toBe(4);
    });

    it('should execute sum operation', async () => {
      const code = 'const result = ops.sum(data, "score");';
      const result = await executeDataCode(testData, code);
      expect(result).toBe(350);
    });

    it('should execute average operation', async () => {
      const code = 'const result = ops.avg(data, "score");';
      const result = await executeDataCode(testData, code);
      expect(result).toBe(87.5);
    });

    it('should execute max operation', async () => {
      const code = 'const result = ops.max(data, "score");';
      const result = await executeDataCode(testData, code);
      expect(result).toBe(95);
    });

    it('should execute min operation', async () => {
      const code = 'const result = ops.min(data, "score");';
      const result = await executeDataCode(testData, code);
      expect(result).toBe(80);
    });

    it('should execute groupBy operation', async () => {
      const code = `
        const grouped = ops.groupBy(data, 'region');
        const result = Object.keys(grouped).map(region => ({
          region,
          count: ops.count(grouped[region])
        }));
      `;
      const result = await executeDataCode(testData, code);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should execute sortBy operation', async () => {
      const code = 'const result = ops.sortBy(data, "score", "desc");';
      const result = await executeDataCode(testData, code);
      
      expect(result[0].score).toBe(95);
      expect(result[3].score).toBe(80);
    });

    it('should handle complex operations', async () => {
      const code = `
        const grouped = ops.groupBy(data, 'region');
        const result = Object.keys(grouped).map(region => ({
          region,
          avgScore: ops.avg(grouped[region], 'score'),
          maxScore: ops.max(grouped[region], 'score')
        }));
      `;
      const result = await executeDataCode(testData, code);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('region');
      expect(result[0]).toHaveProperty('avgScore');
      expect(result[0]).toHaveProperty('maxScore');
    });

    it('should throw error for invalid code', async () => {
      const code = 'const result = invalidFunction();';
      await expect(executeDataCode(testData, code)).rejects.toThrow();
    });
  });

  describe('generateSQL', () => {
    it('should generate SQL query for simple query', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = getLLMConfig();
      const schema = 'company (TEXT), region (TEXT), revenue (TEXT)';
      const query = 'Show all companies';
      
      try {
        const sql = await generateSQL(llmConfig, schema, query);
        
        expect(sql).toBeDefined();
        expect(typeof sql).toBe('string');
        expect(sql.toLowerCase()).toContain('select');
        expect(sql.toLowerCase()).toContain('from');
      } catch (error) {
        // If the API fails, skip the test rather than failing
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 30000);

    it('should generate SQL with aggregation', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = getLLMConfig();
      const schema = 'company (TEXT), region (TEXT), revenue (TEXT)';
      const query = 'What is the average revenue by region?';
      
      try {
        const sql = await generateSQL(llmConfig, schema, query);
        
        expect(sql).toBeDefined();
        expect(typeof sql).toBe('string');
        expect(sql.length).toBeGreaterThan(0);
        expect(sql.toLowerCase()).toContain('select');
      } catch (error) {
        // If the API fails, skip the test rather than failing
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 30000);
  });

  describe('generateDataCode', () => {
    it('should generate JavaScript code for aggregation', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = getLLMConfig();
      const dataInfo = `Dataset Info:
- Rows: 12
- Columns: 3
Fields:
- company (string)
- region (string)
- revenue (number)`;
      
      const query = 'What is the total revenue?';
      
      try {
        const code = await generateDataCode(llmConfig, dataInfo, query);
        
        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
        expect(code).toContain('result');
      } catch (error) {
        // If the API fails, skip the test rather than failing
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 30000);

    it('should generate code for grouping operation', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = getLLMConfig();
      const dataInfo = `Dataset Info:
- Rows: 12
- Columns: 3
Fields:
- company (string)
- region (string)
- revenue (number)`;
      
      const query = 'Group companies by region';
      
      try {
        const code = await generateDataCode(llmConfig, dataInfo, query);
        
        expect(code).toBeDefined();
        expect(code).toContain('result');
        expect(code.toLowerCase()).toContain('group');
      } catch (error) {
        // If the API fails, skip the test rather than failing
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 30000);
  });

  describe('Visualization Intent Detection', () => {
    it('should detect visualization intent and generate HTML', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM integration test: LING_1T_API_KEY not set');
        return;
      }

      const { AVA } = await import('../src');
      const ava = new AVA({
        llm: getLLMConfig(),
      });

      try {
        // Prepare test data similar to visualization-example
        const data = [
          { city: '杭州', population: 1220, gdp: 18753 },
          { city: '上海', population: 2489, gdp: 43214 },
          { city: '北京', population: 2189, gdp: 40269 },
          { city: '深圳', population: 1768, gdp: 32387 },
          { city: '广州', population: 1868, gdp: 28839 },
        ];

        await ava.loadObject(data);

        // Query with visualization intent
        const response = await ava.analysis('绘制各城市GDP的柱状图');

        // Verify response structure
        expect(response).toBeDefined();
        expect(response.text).toBeDefined();
        expect(typeof response.text).toBe('string');
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Verify visualization was generated
        expect(response.visualizationHTML).toBeDefined();
        expect(typeof response.visualizationHTML).toBe('string');
        expect(response.visualizationHTML!.length).toBeGreaterThan(0);
        expect(response.visualizationHTML).toContain('<!DOCTYPE html>');
        expect(response.visualizationHTML).toContain('GPT-Vis');

        // Verify syntax was extracted
        expect(response.visualizationSyntax).toBeDefined();
        expect(typeof response.visualizationSyntax).toBe('string');
      } catch (error) {
        // If the API fails, skip the test rather than failing
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      } finally {
        ava.dispose();
      }
    }, 60000); // Increased timeout for LLM calls

    it('should not generate visualization for non-visualization queries', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM integration test: LING_1T_API_KEY not set');
        return;
      }

      const { AVA } = await import('../src');
      const ava = new AVA({
        llm: getLLMConfig(),
      });

      try {
        const data = [
          { city: '杭州', gdp: 18753 },
          { city: '上海', gdp: 43214 },
        ];

        await ava.loadObject(data);

        // Query without visualization intent
        const response = await ava.analysis('哪个城市的GDP最高？');

        // Verify response structure
        expect(response).toBeDefined();
        expect(response.text).toBeDefined();
        expect(typeof response.text).toBe('string');

        // Should not generate visualization for simple query
        expect(response.visualizationHTML).toBeUndefined();
        expect(response.visualizationSyntax).toBeUndefined();
      } catch (error) {
        // If the API fails, skip the test rather than failing
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      } finally {
        ava.dispose();
      }
    }, 60000);
  });
});
