/**
 * Integration tests for the AVA main class
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AVA } from '../src';
import * as suggestions from '../src/suggest';

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
    const onEnd = vi.fn();
    ava.on('loadend', onEnd);
    const message = 'No data loaded. Please call source() first.';
    await expect(ava.schema()).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ first: 1 }] } });
    expect(onEnd).toHaveBeenLastCalledWith({ type: 'loadend', data: {} });
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
    const onStart = vi.fn();
    const onEnd = vi.fn();
    ava.on('profilestart', onStart);
    ava.on('profileend', onEnd);
    const message = 'No data loaded. Please call source() first.';
    await expect(ava.profile()).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ value: 2 }, { value: 4 }, { value: null }] } });

    const profile = await ava.profile();
    expect(profile.generatedAt).toEqual(expect.any(Number));
    expect(profile.tables[0].metrics).toEqual({ row_count: 3 });
    expect(profile.tables[0].fields[0].metrics).toMatchObject({ null_count: 1, min: 2, max: 4, mean: 3 });

    const selected = await ava.profile({ metrics: ['row_count', 'sum'] });
    expect(onStart).toHaveBeenLastCalledWith({ type: 'profilestart', data: {} });
    expect(onEnd).toHaveBeenLastCalledWith({ type: 'profileend', data: {} });
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

  it('emits analysis status and errors while returning the complete result', async () => {
    const onEvent = vi.fn();
    const onQueryEnd = vi.fn();
    ava.on('analyzestart', onEvent);
    ava.on('analyzeend', onEvent);
    ava.on('queryend', onQueryEnd);
    await expect(ava.analyze('Total value')).rejects.toThrow('No data loaded');
    expect(onEvent).not.toHaveBeenCalled();
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('SELECT SUM(value) AS total FROM data');
    const query = 'Total value';
    const config = { includeSummary: false, strategy: { type: 'direct' as const, maxRetries: 0 } };

    const result = await ava.analyze(query, config);
    expect(result.data).toEqual([{ total: 2 }]);
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { type: 'analyzestart', data: { query } },
      { type: 'analyzeend', data: {} },
    ]);
    expect(onQueryEnd.mock.calls[0][0].data.data).toBe(result.data);

    onEvent.mockClear();
    const error = new Error('Analysis execution failed');
    vi.spyOn(ava.engine!, 'execute').mockRejectedValueOnce(error);
    await expect(ava.analyze(query, config)).rejects.toBe(error);
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { type: 'analyzestart', data: { query } },
      { type: 'analyzeend', data: { error: { name: 'Error', message: error.message } } },
    ]);
  });

  it('emits suggestion status without repeating inputs or results', async () => {
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    const result = [{ query: 'Total value?', score: 1, reason: 'Useful' }];
    vi.spyOn(suggestions, 'generateSuggestions').mockResolvedValueOnce(result);
    const onEvent = vi.fn();
    ava.on('suggeststart', onEvent);
    ava.on('suggestend', onEvent);

    await expect(ava.suggest(1)).resolves.toBe(result);
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { type: 'suggeststart', data: {} },
      { type: 'suggestend', data: {} },
    ]);
    expect(suggestions.generateSuggestions).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 1);
  });

  it('translates queries with schema and optional profile without executing them', async () => {
    const onEvent = vi.fn();
    ava.on('translatestart', onEvent);
    ava.on('translateend', onEvent);
    const message = 'No data loaded. Please call source() first.';
    await expect(ava['translate']('Total value')).rejects.toThrow(message);
    expect(onEvent).not.toHaveBeenCalled();
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    const schema = await ava.schema();
    const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('SELECT SUM(value) FROM data');
    const execute = vi.spyOn(ava.engine!, 'execute');

    await expect(ava['translate']('Total value')).resolves.toBe('SELECT SUM(value) FROM data');
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { type: 'translatestart', data: { query: 'Total value' } },
      { type: 'translateend', data: { dsl: 'SELECT SUM(value) FROM data' } },
    ]);
    expect(getDSL).toHaveBeenLastCalledWith('Total value', { schema, profile: undefined });
    const profile = await ava.profile();
    await ava['translate']('Total value');
    expect(getDSL).toHaveBeenLastCalledWith('Total value', { schema, profile });
    expect(execute).not.toHaveBeenCalled();

    const error = new Error('Translation failed');
    getDSL.mockRejectedValueOnce(error);
    await expect(ava['translate']('Total value')).rejects.toBe(error);
    expect(onEvent).toHaveBeenNthCalledWith(5, { type: 'translatestart', data: { query: 'Total value' } });
    expect(onEvent).toHaveBeenNthCalledWith(6, {
      type: 'translateend',
      data: { error: { name: 'Error', message: 'Translation failed' } },
    });
    await ava.dispose();
    await expect(ava['translate']('Total value')).rejects.toThrow(message);
    expect(onEvent).toHaveBeenCalledTimes(6);
  });

  it('executes bounded read-only queries and rejects writes', async () => {
    const onStart = vi.fn();
    ava.on('querystart', onStart);
    const message = 'No data loaded. Please call source() first.';
    await expect(ava['query']('SELECT 1')).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ value: 2 }, { value: 4 }] } });
    const dsl = 'SELECT value FROM data ORDER BY value';
    expect(await ava['query'](dsl)).toMatchObject({
      data: [{ value: 2 }, { value: 4 }],
      schema: [{ name: 'value' }],
      rowCount: 2,
    });
    expect(await ava['query'](dsl, { maxRows: 1 })).toMatchObject({
      data: [{ value: 2 }],
      truncated: true,
      truncatedBy: 'maxRows',
    });
    expect(onStart).toHaveBeenLastCalledWith({ type: 'querystart', data: { dsl } });
    expect(await ava['query'](dsl, { maxResultBytes: 1 })).toMatchObject({
      data: [],
      truncated: true,
      truncatedBy: 'maxResultBytes',
    });
    await expect(ava['query']('CREATE TABLE forbidden (value INTEGER)')).rejects.toThrow('read-only SELECT');
    await expect(ava['query']('DELETE FROM data')).rejects.toThrow();
    await expect(ava['query']('SELECT 1; SELECT 2')).rejects.toThrow('exactly one');
    await expect(ava['query']('SELECT missing FROM data')).rejects.toThrow();
    expect((await ava['query'](dsl)).data).toEqual([{ value: 2 }, { value: 4 }]);
    await ava.dispose();
    await expect(ava['query'](dsl)).rejects.toThrow(message);
  });

  it('delegates interpreter queries without changing the loaded data', async () => {
    ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    const execute = vi.spyOn(ava.engine!, 'execute');
    expect((await ava['query']('data.length = 0; const result = data;')).data).toEqual([]);
    expect(execute).toHaveBeenCalledWith('data.length = 0; const result = data;', undefined);
    expect((await ava['query']('const result = data;')).data).toEqual([{ value: 2 }]);
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
