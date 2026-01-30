/**
 * Unit tests for analysis module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteDataStore, executeDataCode, generateSQL, generateDataCode } from '../index';

describe('Analysis Module', () => {
  describe('SQLiteDataStore', () => {
    let store: SQLiteDataStore;

    beforeEach(() => {
      store = new SQLiteDataStore();
    });

    afterEach(() => {
      store.close();
    });

    it('should create and load data', () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      store.loadData(testData);
      const result = store.query('SELECT * FROM data');
      
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });

    it('should handle empty data', () => {
      store.loadData([]);
      const schema = store.getSchema();
      expect(schema).toBeDefined();
    });

    it('should query with WHERE clause', () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      store.loadData(testData);
      const result = store.query("SELECT * FROM data WHERE city = 'NYC'");
      
      expect(result.length).toBe(2);
    });

    it('should query with aggregation', () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      store.loadData(testData);
      const result = store.query('SELECT COUNT(*) as count FROM data');
      
      expect(result[0].count).toBe(3);
    });

    it('should get schema info', () => {
      const testData = [{ name: 'Alice', age: 30 }];
      store.loadData(testData);
      
      const schema = store.getSchema();
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
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = {
        model: 'Ling-1T',
        apiKey,
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      };

      const schema = 'company (TEXT), region (TEXT), revenue (TEXT)';
      const query = 'Show all companies';
      
      const sql = await generateSQL(llmConfig, schema, query);
      
      expect(sql).toBeDefined();
      expect(typeof sql).toBe('string');
      expect(sql.toLowerCase()).toContain('select');
      expect(sql.toLowerCase()).toContain('from');
    }, 30000);

    it('should generate SQL with aggregation', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = {
        model: 'Ling-1T',
        apiKey,
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      };

      const schema = 'company (TEXT), region (TEXT), revenue (TEXT)';
      const query = 'What is the average revenue by region?';
      
      const sql = await generateSQL(llmConfig, schema, query);
      
      expect(sql).toBeDefined();
      expect(sql.toLowerCase()).toContain('select');
      expect(sql.toLowerCase()).toContain('avg');
      expect(sql.toLowerCase()).toContain('group');
    }, 30000);
  });

  describe('generateDataCode', () => {
    it('should generate JavaScript code for aggregation', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = {
        model: 'Ling-1T',
        apiKey,
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      };

      const dataInfo = `Dataset Info:
- Rows: 12
- Columns: 3
Fields:
- company (string)
- region (string)
- revenue (number)`;
      
      const query = 'What is the total revenue?';
      const code = await generateDataCode(llmConfig, dataInfo, query);
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code).toContain('result');
    }, 30000);

    it('should generate code for grouping operation', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const llmConfig = {
        model: 'Ling-1T',
        apiKey,
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      };

      const dataInfo = `Dataset Info:
- Rows: 12
- Columns: 3
Fields:
- company (string)
- region (string)
- revenue (number)`;
      
      const query = 'Group companies by region';
      const code = await generateDataCode(llmConfig, dataInfo, query);
      
      expect(code).toBeDefined();
      expect(code).toContain('result');
      expect(code.toLowerCase()).toContain('group');
    }, 30000);
  });
});
