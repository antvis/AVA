/**
 * Integration tests for the AVA main class
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AVA } from '../src/ava';

import { getLLMConfig, skipLLMTests } from './test-utils';

describe('AVA', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../data/companies.csv');

  beforeEach(() => {
    ava = new AVA({ llm: getLLMConfig() });
  });

  afterEach(async () => {
    await ava?.dispose();
  });

  describe('Data Loading', () => {
    it('should load a CSV file and return its schema', async () => {
      const schema = await ava.loadCSV(testDataPath);

      expect(schema.rowCount).toBe(12);
      expect(schema.columnCount).toBe(3);
      expect(schema.fields.find((f) => f.name === 'revenue')?.type).toBe('number');
    });

    it('should throw when analyzing without loading data', async () => {
      await expect(ava.analysis('test query')).rejects.toThrow('No data loaded');
    });
  });

  describe.skipIf(skipLLMTests)('analysis', () => {
    it('should answer a natural language query with a summary and data', async () => {
      await ava.loadCSV(testDataPath);

      const result = await ava.analysis('What is the average revenue by region?');

      expect(result.query).toBe('What is the average revenue by region?');
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.data).toBeDefined();
      expect(result.sql).toBeDefined();
    }, 60000);
  });

  describe.skipIf(skipLLMTests)('visualize', () => {
    it('should generate chart HTML from an analysis result', async () => {
      await ava.loadCSV(testDataPath);
      const analysisResult = await ava.analysis('Visualize the average revenue by region as a bar chart');

      const viz = await ava.visualize(analysisResult);

      expect(viz).not.toBeNull();
      expect(typeof viz!.chartType).toBe('string');
      expect(viz!.html).toContain('<!DOCTYPE html>');
    }, 120000);
  });

  describe.skipIf(skipLLMTests)('loadText', () => {
    it('should extract structured data from text and analyze it', async () => {
      await ava.loadText('杭州 100，上海 200，北京 300');

      const result = await ava.analysis('What is the sum of all values?');

      expect(result.text).toMatch(/600/);
    }, 60000);
  });

  describe('dispose', () => {
    it('should dispose resources without error', async () => {
      await ava.loadCSV(testDataPath);
      await expect(ava.dispose()).resolves.toBeUndefined();
    });
  });
});
