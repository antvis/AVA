/**
 * Unit tests for analysis module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../src';
import { DuckDBEngine, generateSQL } from '../src/duckdb';

import { getLLMConfig, skipLLMTests } from './test-utils';

describe('Analysis Module', () => {
  describe('DuckDBEngine', () => {
    let engine: DuckDBEngine;

    beforeEach(() => {
      engine = new DuckDBEngine(getLLMConfig());
    });

    afterEach(async () => {
      await engine.dispose();
    });

    it('should create and load data', async () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      await engine.load({ type: 'object', options: { data: testData } });
      const result = await engine.execute('SELECT * FROM data');

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });

    it('should handle empty data', async () => {
      await engine.load({ type: 'object', options: { data: [] } });
      const schema = await engine.getSchema();
      expect(schema).toBeDefined();
    });

    it('should query with WHERE clause', async () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      await engine.load({ type: 'object', options: { data: testData } });
      const result = await engine.execute("SELECT * FROM data WHERE city = 'NYC'");

      expect(result.length).toBe(2);
    });

    it('should query with aggregation', async () => {
      const testData = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'SF' },
        { name: 'Charlie', age: 35, city: 'NYC' },
      ];

      await engine.load({ type: 'object', options: { data: testData } });
      const result = await engine.execute('SELECT COUNT(*) as count FROM data');

      expect(result[0].count).toBe(3);
    });

    it('should get schema info', async () => {
      const testData = [{ name: 'Alice', age: 30 }];
      await engine.load({ type: 'object', options: { data: testData } });

      const schema = await engine.getSchema();
      expect(schema).toContain('name');
      expect(schema).toContain('age');
    });
  });

  describe.skipIf(skipLLMTests)('generateSQL', () => {
    it('should generate SQL query for simple query', async () => {
      const llmConfig = getLLMConfig();
      const schema = 'company (TEXT), region (TEXT), revenue (TEXT)';
      const query = 'Show all companies';
      
      const sql = await generateSQL(llmConfig, schema, query);

      expect(sql).toBeDefined();
      expect(typeof sql).toBe('string');
      expect(sql.toLowerCase()).toContain('select');
      expect(sql.toLowerCase()).toContain('from');
    }, 30000);

    it('should generate SQL with aggregation', async () => {
      const llmConfig = getLLMConfig();
      const schema = 'company (TEXT), region (TEXT), revenue (TEXT)';
      const query = 'What is the average revenue by region?';
      
      const sql = await generateSQL(llmConfig, schema, query);

      expect(sql).toBeDefined();
      expect(typeof sql).toBe('string');
      expect(sql.length).toBeGreaterThan(0);
      expect(sql.toLowerCase()).toContain('select');
    }, 30000);
  });

  describe.skipIf(skipLLMTests)('Visualization Intent Detection', () => {
    it('should detect visualization intent and generate HTML', async () => {
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
        expect(response.data).not.toBeNull();
        // The shape is decided by the LLM-generated code: a row array for tabular queries, an
        // aggregate object for scalar ones. visualize() accepts both (see
        // formatDatasetInfoWithNonArray), so Array.isArray is deliberately not asserted here —
        // the visualize assertions below are the real signal.

        // Verify visualization can be generated from the analysis result
        const vis = await ava.visualize(response);
        expect(vis).not.toBeNull();
        expect(vis!.chartType).toBeDefined();
        expect(typeof vis!.syntax).toBe('string');
        expect(vis!.html.length).toBeGreaterThan(0);
        expect(vis!.html).toContain('<!DOCTYPE html>');
        // The standalone HTML must load the gpt-vis UMD bundle and mount the class (see wrapSyntaxInHTML)
        expect(vis!.html).toContain('@antv/gpt-vis/dist/umd/index.min.js');
        expect(vis!.html).toContain('new GPTVis.GPTVis');
      } finally {
        await ava.dispose();
      }
    }, 60000); // Increased timeout for LLM calls

    it('should not generate visualization for non-visualization queries', async () => {
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

        // Analysis result carries no visualization; the advisor declines simple queries
        expect(response).not.toHaveProperty('visualizationHTML');
        const vis = await ava.visualize(response);
        expect(vis).toBeNull();
      } finally {
        await ava.dispose();
      }
    }, 60000);
  });
});
