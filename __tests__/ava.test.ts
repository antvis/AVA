/**
 * Integration tests for the AVA main class
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AVA } from '../src';

import { getLLMConfig, skipLLMTests } from './test-utils';

describe('AVA', () => {
  let ava: AVA;
  const testDataPath = path.join(__dirname, '../data/companies.csv');

  beforeEach(() => {
    ava = new AVA({ llm: getLLMConfig() });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await ava?.dispose();
  });

  it('returns the current schema throughout the source lifecycle', async () => {
    const message = 'No data loaded. Please call source() first.';
    await expect(ava.schema()).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ first: 1 }] } });
    const first = await ava.schema();
    expect(first.tables[0].fields.map((field) => field.name)).toEqual(['first']);
    const before = JSON.stringify(first);
    await ava.profile();
    expect(JSON.stringify(await ava.schema())).toBe(before);
    expect(first).not.toHaveProperty('generatedAt');
    expect(first.tables[0].fields[0]).not.toHaveProperty('metrics');

    await ava.source({ type: 'json', options: { data: [{ second: 'value' }] } });
    expect((await ava.schema()).tables[0].fields.map((field) => field.name)).toEqual(['second']);
    await expect(ava.source({ type: 'json', options: { data: null } })).rejects.toThrow();
    await expect(ava.schema()).rejects.toThrow(message);

    await ava.source({ type: 'json', options: { data: [{ third: true }] } });
    await ava.dispose();
    await expect(ava.schema()).rejects.toThrow(message);
  });

  it('profiles default and selected metrics for the loaded source', async () => {
    const message = 'No data loaded. Please call source() first.';
    await expect(ava.profile()).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ value: 2 }, { value: 4 }, { value: null }] } });

    const profile = await ava.profile();
    expect(profile.generatedAt).toEqual(expect.any(Number));
    expect(profile.tables[0].metrics).toEqual({ row_count: 3 });
    expect(profile.tables[0].fields[0].metrics).toMatchObject({ null_count: 1, min: 2, max: 4, mean: 3 });

    const selected = await ava.profile({ metrics: ['row_count', 'sum'] });
    expect(selected.tables[0].metrics).toEqual({ row_count: 3 });
    expect(selected.tables[0].fields[0].metrics).toEqual({ sum: 6 });
    const empty = await ava.profile({ metrics: [] });
    expect(empty.tables[0].metrics).toEqual({});
    expect(empty.tables[0].fields[0].metrics).toEqual({});
    await expect(ava.profile({ metrics: ['missing'] })).rejects.toThrow('Unknown metric');

    await ava.source({ type: 'json', options: { data: [{ value: 10 }] } });
    expect((await ava.profile({ metrics: ['sum'] })).tables[0].fields[0].metrics).toEqual({ sum: 10 });
    await ava.dispose();
    await expect(ava.profile()).rejects.toThrow(message);
  });

  it('translates queries with schema and optional profile without executing them', async () => {
    const message = 'No data loaded. Please call source() first.';
    await expect(ava['translate']('Total value')).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    const schema = await ava.schema();
    const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('SELECT SUM(value) FROM data');
    const execute = vi.spyOn(ava.engine!, 'execute');

    await expect(ava['translate']('Total value')).resolves.toBe('SELECT SUM(value) FROM data');
    expect(getDSL).toHaveBeenLastCalledWith('Total value', { schema, profile: undefined });
    const profile = await ava.profile();
    await ava['translate']('Total value');
    expect(getDSL).toHaveBeenLastCalledWith('Total value', { schema, profile });
    expect(execute).not.toHaveBeenCalled();

    getDSL.mockRejectedValueOnce(new Error('Translation failed'));
    await expect(ava['translate']('Total value')).rejects.toThrow('Translation failed');
    await ava.dispose();
    await expect(ava['translate']('Total value')).rejects.toThrow(message);
  });

  describe('Data Loading', () => {
    it('should load a CSV file without returning a schema', async () => {
      await expect(ava.source({ type: 'csv-file', options: { path: testDataPath } })).resolves.toBeUndefined();
      const schema = await ava.schema();

      expect(schema.tables).toHaveLength(1);
      const table = schema.tables[0];
      expect(table).not.toHaveProperty('rowCount');
      expect(table.columnCount).toBe(3);
      expect(table.fields.find((f) => f.name === 'revenue')?.type).toBe('BIGINT');
    });

    it('should throw when analyzing without loading data', async () => {
      await expect(ava.analyze('test query')).rejects.toThrow('No data loaded');
    });
  });

  describe.skipIf(skipLLMTests)('analyze', () => {
    it('should answer a natural language query with a summary and data', async () => {
      await ava.source({ type: 'csv-file', options: { path: testDataPath } });

      const result = await ava.analyze('What is the average revenue by region?');

      expect(result.query).toBe('What is the average revenue by region?');
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.data).toBeDefined();
      expect(result.sql).toBeDefined();
    }, 60000);
  });

  describe.skipIf(skipLLMTests)('visualize', () => {
    it('should generate chart HTML from an analysis result', async () => {
      await ava.source({ type: 'csv-file', options: { path: testDataPath } });
      const analysisResult = await ava.analyze('Visualize the average revenue by region as a bar chart');

      const viz = await ava.visualize(analysisResult);

      expect(viz).not.toBeNull();
      expect(typeof viz!.chartType).toBe('string');
      expect(viz!.html).toContain('<!DOCTYPE html>');
    }, 120000);
  });

  describe.skipIf(skipLLMTests)('loadText', () => {
    it('should extract structured data from text and analyze it', async () => {
      await ava.source({ type: 'text', options: { text: '杭州 100，上海 200，北京 300' } });

      const result = await ava.analyze('What is the sum of all values?');

      expect(result.text).toMatch(/600/);
    }, 60000);
  });

  describe('dispose', () => {
    it('should dispose resources without error', async () => {
      await ava.source({ type: 'csv-file', options: { path: testDataPath } });
      await expect(ava.dispose()).resolves.toBeUndefined();
    });
  });
});
