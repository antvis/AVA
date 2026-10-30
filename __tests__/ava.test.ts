/**
 * Integration tests for the AVA main class
 */

import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AVA } from '../src';
import { LifecycleEvent, LifecycleEventType } from '../src/event';
import { JavaScriptEngine } from '../src/interpreter/javascript';
import { buildDataModel } from '../src/util/data-model';
import * as suggestions from '../src/suggest';
import * as duckdbSchema from '../src/duckdb/util/schema';
import * as memorySchema from '../src/util/schema';

import { getLLMConfig, skipLLMTests } from './test-utils';

import type { DataSourceConfig, Profile, Schema, Semantic } from '../src';

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
    ava.on(LifecycleEventType.SOURCE_END, onEnd);
    const message = 'No data loaded. Please call source() first.';
    await expect(ava.schema()).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ first: 1 }] } });
    expect(onEnd).toHaveBeenLastCalledWith({ type: 'sourceend', data: {} });
    expect(onEnd.mock.lastCall?.[0]).toBeInstanceOf(LifecycleEvent);
    const first = await ava.schema();
    expect(first.models[0].columns.map((field) => field.name)).toEqual(['first']);
    const before = JSON.stringify(first);
    await ava.profile();
    expect(JSON.stringify(await ava.schema())).toBe(before);
    expect(first).not.toHaveProperty('generatedAt');
    expect(first.models[0].columns[0]).not.toHaveProperty('metrics');

    await ava.source({ type: 'json', options: { data: [{ second: 'value' }] } });
    expect((await ava.schema()).models[0].columns.map((field) => field.name)).toEqual(['second']);
    await expect(ava.source({ type: 'json', options: { data: null } })).rejects.toThrow();
    await expect(ava.schema()).rejects.toThrow(message);

    await ava.source({ type: 'json', options: { data: [{ third: true }] } });
    await ava.dispose();
    await expect(ava.schema()).rejects.toThrow(message);
  });

  it.each(['schema', 'profile', 'analyze', 'translate', 'suggest'] as const)(
    'discovers schema lazily for %s and reuses it',
    async (operation) => {
      ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
      const discover = vi.spyOn(JavaScriptEngine.prototype, 'schema');
      await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
      expect((await ava.query('const result = data;')).data).toEqual([{ value: 2 }]);
      expect(discover).not.toHaveBeenCalled();
      vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      vi.spyOn(suggestions, 'generateSuggestions').mockResolvedValue([]);
      const computeProfile = vi.spyOn(ava.engine!, 'profile');
      const onSchema = vi.fn();
      ava.on('schemastart', onSchema);
      ava.on('schemaend', onSchema);

      if (operation === 'analyze') await ava.analyze('Rows', { includeSummary: false });
      else if (operation === 'translate') await ava.translate('Rows');
      else await ava[operation]();

      expect(onSchema.mock.calls.map(([event]) => event.type)).toEqual(
        operation === 'schema' ? ['schemastart', 'schemaend'] : []
      );
      if (operation !== 'profile') expect(computeProfile).not.toHaveBeenCalled();
      expect(discover).toHaveBeenCalledOnce();
      const schema = await ava.schema();
      expect(schema.models[0].columns[0].name).toBe('value');
      expect(discover).toHaveBeenCalledOnce();
      await ava.source({ type: 'json', options: { data: [{ next: 3 }] } });
      expect(discover).toHaveBeenCalledOnce();
      expect((await ava.schema()).models[0].columns[0].name).toBe('next');
      expect(discover).toHaveBeenCalledTimes(2);
    }
  );

  it.each(['schema', 'profile'] as const)(
    'emits one %s end event per computation with its outcome',
    async (operation) => {
      ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
      await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
      const onEvent = vi.fn();
      ava.on(`${operation}start`, onEvent);
      ava.on(`${operation}end`, onEvent);
      const error = new Error(`${operation} failed`);
      vi.spyOn(ava.engine!, operation).mockRejectedValueOnce(error);

      await expect(ava[operation]()).rejects.toBe(error);
      expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
        { type: `${operation}start`, data: {} },
        { type: `${operation}end`, data: { error: { name: 'Error', message: error.message } } },
      ]);

      onEvent.mockClear();
      await ava[operation]();
      expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
        { type: `${operation}start`, data: {} },
        { type: `${operation}end`, data: {} },
      ]);
      if (operation === 'schema') {
        onEvent.mockClear();
        await ava.schema();
        expect(onEvent).not.toHaveBeenCalled();
      }
    }
  );

  it.each(['profile', 'analyze', 'translate', 'suggest'] as const)(
    'reports internal schema discovery failure only through %s',
    async (operation) => {
      ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
      await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
      const onEvent = vi.fn();
      ava.on('*', onEvent);
      const error = new Error('Discovery failed');
      vi.spyOn(ava.engine!, 'schema').mockRejectedValueOnce(error);
      const compute = vi.spyOn(ava.engine!, 'profile');

      const result = operation === 'analyze' || operation === 'translate' ? ava[operation]('Rows') : ava[operation]();
      await expect(result).rejects.toBe(error);
      const failure = { error: { name: 'Error', message: error.message } };
      expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
        {
          type: `${operation}start`,
          data: operation === 'analyze' || operation === 'translate' ? { query: 'Rows' } : {},
        },
        { type: `${operation}end`, data: failure },
      ]);
      expect(compute).not.toHaveBeenCalled();
    }
  );

  it('profiles default and selected metrics for the loaded source', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    ava.on('profilestart', onStart);
    ava.on('profileend', onEnd);
    const message = 'No data loaded. Please call source() first.';
    await expect(ava.profile()).rejects.toThrow(message);
    await ava.source({ type: 'json', options: { data: [{ value: 2 }, { value: 4 }, { value: null }] } });

    const profile = await ava.profile();
    expect(profile.models[0].metrics).toEqual({ row_count: 3 });
    expect(profile.models[0].columns[0].metrics).toMatchObject({ null_count: 1, min: 2, max: 4, mean: 3 });

    const selected = await ava.profile({ metrics: ['row_count', 'sum'] });
    expect(onStart).toHaveBeenLastCalledWith({ type: 'profilestart', data: {} });
    expect(onEnd).toHaveBeenLastCalledWith({ type: 'profileend', data: {} });
    expect(selected.models[0].metrics).toEqual({ row_count: 3 });
    expect(selected.models[0].columns[0].metrics).toEqual({ sum: 6 });
    const empty = await ava.profile({ metrics: [] });
    expect(empty.models[0].metrics).toEqual({});
    expect(empty.models[0].columns[0].metrics).toEqual({});
    await expect(ava.profile({ metrics: ['missing'] })).rejects.toThrow('Unknown metric');

    await ava.source({ type: 'json', options: { data: [{ value: 10 }] } });
    expect((await ava.profile({ metrics: ['sum'] })).models[0].columns[0].metrics).toEqual({ sum: 10 });
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

  it('rejects the removed subset strategy without profiling or executing a query', async () => {
    ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    const compute = vi.spyOn(ava.engine!, 'profile');
    const getDSL = vi.spyOn(ava.engine!, 'getDSL');
    const execute = vi.spyOn(ava.engine!, 'execute');

    // @ts-expect-error Verify rejection for untyped callers using the removed strategy.
    await expect(ava.analyze('Rows', { strategy: { type: 'subset' } })).rejects.toThrow(
      'Unknown analysis strategy: subset'
    );
    expect(compute).not.toHaveBeenCalled();
    expect(getDSL).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
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
    expect(suggestions.generateSuggestions).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 1, expect.any(Function));
  });

  it('forwards translation usage events to AVA listeners', async () => {
    ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    const usage = { totalTokens: 12 };
    vi.spyOn(ava.engine!, 'getDSL').mockImplementation(async (_query, _model, reportUsage) => {
      reportUsage?.(usage as never);
      return 'const result = data;';
    });
    const listener = vi.fn();
    ava.on('translateend', listener);
    await ava.translate('Rows');
    await ava.analyze('Rows', { includeSummary: false });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'translateend', data: { dsl: 'const result = data;', usage } }));
    expect(listener).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'translateend', data: { dsl: 'const result = data;', usage }, context: expect.objectContaining({ stepId: expect.any(String) }) }));
    vi.mocked(ava.engine!.getDSL).mockImplementationOnce(async (_query, _model, reportUsage) => {
      reportUsage?.(usage as never);
      throw new Error('Translation failed');
    });
    await expect(ava.translate('Rows')).rejects.toThrow('Translation failed');
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ data: { usage, error: { name: 'Error', message: 'Translation failed' } } }));
  });

  it('accumulates repeated engine usage during source and translation', async () => {
    ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
    const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
    const load = vi.spyOn(JavaScriptEngine.prototype, 'load').mockImplementationOnce(async (_config, reportUsage) => {
      reportUsage?.(usage as never);
      reportUsage?.(usage as never);
    });
    const sourceEnd = vi.fn();
    ava.on('sourceend', sourceEnd);
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    expect(sourceEnd).toHaveBeenCalledWith(expect.objectContaining({ data: { usage: expect.objectContaining({ totalTokens: 30 }) } }));
    load.mockRestore();
    await ava.source({ type: 'json', options: { data: [{ value: 2 }] } });
    vi.spyOn(ava.engine!, 'getDSL').mockImplementation(async (_query, _model, reportUsage) => {
      reportUsage?.(usage as never);
      reportUsage?.(usage as never);
      return 'const result = data;';
    });
    const translationEnd = vi.fn();
    ava.on('translateend', translationEnd);
    await ava.translate('Rows');
    await ava.analyze('Rows', { includeSummary: false });
    expect(translationEnd).toHaveBeenCalledTimes(2);
    for (const [event] of translationEnd.mock.calls) {
      expect(event.data.usage).toMatchObject({ inputTokens: 20, outputTokens: 10, totalTokens: 30 });
    }
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
    expect(getDSL).toHaveBeenLastCalledWith('Total value', schema, expect.any(Function));
    const snapshot = getDSL.mock.calls.at(-1)![1];
    const profile = await ava.profile();
    expect(snapshot).toEqual(schema);
    await ava['translate']('Total value');
    expect(getDSL).toHaveBeenLastCalledWith('Total value', buildDataModel({ schema, profile }), expect.any(Function));
    expect(snapshot).toEqual(schema);
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

      expect(schema.models).toHaveLength(1);
      const table = schema.models[0];
      expect(table).not.toHaveProperty('rowCount');
      expect(table.columns).toHaveLength(3);
      expect(table.columns.find((f) => f.name === 'revenue')?.type).toBe('BIGINT');
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
    it.each(['dispose', 'source'])('clears state when engine disposal fails during %s', async (operation) => {
      ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
      const source = { type: 'json' as const, options: { data: [{ value: 2 }] } };
      await ava.source(source);
      await ava.profile({ metrics: ['row_count'] });
      const engine = ava.engine!;
      const release = engine.dispose.bind(engine);
      const error = new Error('Release failed');
      vi.spyOn(engine, 'dispose').mockImplementationOnce(async () => {
        await release();
        throw error;
      });
      const onCreate = vi.fn();
      const onDisposeEnd = vi.fn();
      ava.on('createstart', onCreate);
      ava.on('disposeend', onDisposeEnd);

      await expect(operation === 'source' ? ava.source(source) : ava.dispose()).rejects.toBe(error);
      expect(ava.engine).toBeNull();
      await expect(ava.schema()).rejects.toThrow('No data loaded');
      await expect(ava.query('const result = data;')).rejects.toThrow('No data loaded');
      expect(onCreate).not.toHaveBeenCalled();
      expect(onDisposeEnd).toHaveBeenCalledExactlyOnceWith({
        type: 'disposeend',
        data: { error: { name: 'Error', message: error.message } },
      });
      await expect(ava.dispose()).resolves.toBeUndefined();
      expect(engine.dispose).toHaveBeenCalledOnce();

      await ava.source(source);
      const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      await ava.translate('Rows');
      expect(getDSL).toHaveBeenLastCalledWith('Rows', await ava.schema(), expect.any(Function));
    });

    it('keeps loaded data queryable after schema discovery fails and retries discovery', async () => {
      ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
      const source = { type: 'json' as const, options: { data: [{ value: 2 }] } };
      const error = new Error('Schema discovery failed');
      const discover = vi.spyOn(JavaScriptEngine.prototype, 'schema').mockRejectedValueOnce(error);
      const dispose = vi.spyOn(JavaScriptEngine.prototype, 'dispose');

      await ava.source(source);
      expect(discover).not.toHaveBeenCalled();
      await expect(ava.schema()).rejects.toBe(error);
      expect(dispose).not.toHaveBeenCalled();
      expect((await ava.query('const result = data;')).data).toEqual([{ value: 2 }]);
      const schema = await ava.schema();
      expect(schema.models[0].columns[0].name).toBe('value');
      expect(await ava.schema()).toBe(schema);
      expect(discover).toHaveBeenCalledTimes(2);
    });

    it('clears a failed-load engine even when its cleanup also fails', async () => {
      ava = new AVA({ llm: getLLMConfig(), engine: { type: 'javascript' } });
      vi.spyOn(JavaScriptEngine.prototype, 'load').mockRejectedValueOnce(new Error('Load failed'));
      const cleanupError = new Error('Cleanup failed');
      const dispose = vi.spyOn(JavaScriptEngine.prototype, 'dispose').mockRejectedValueOnce(cleanupError);
      await expect(ava.source({ type: 'json', options: { data: [] } })).rejects.toBe(cleanupError);
      expect(dispose).toHaveBeenCalledOnce();
      expect(ava.engine).toBeNull();
      await expect(ava.schema()).rejects.toThrow('No data loaded');
      await expect(ava.profile()).rejects.toThrow('No data loaded');
    });

    it('should dispose resources without error', async () => {
      await ava.source({ type: 'csv-file', options: { path: testDataPath } });
      await expect(ava.dispose()).resolves.toBeUndefined();
    });
  });
});

describe('AVA metadata setters', () => {
  const llm = { model: 'unused' };
  const source: DataSourceConfig = { type: 'json', options: { data: [{ value: 2 }, { value: 4 }] } };
  const schema: Schema = {
    models: [{ name: 'data', columns: [{ name: 'value', type: 'number' }], tableReference: { table: 'data' } }],
  };
  const profile: Profile = {
    models: [
      {
        name: schema.models[0].name,
        metrics: { row_count: 2 },
        columns: [
          { name: schema.models[0].columns[0].name, properties: { logicalType: 'numeric' }, metrics: { mean: 3 } },
        ],
      },
    ],
  };

  afterEach(() => vi.restoreAllMocks());

  it.each(['duckdb', 'javascript'])(
    'supplies semantic definitions to analysis, translation and suggestions with %s',
    async (type) => {
      const ava = new AVA({ llm, engine: { type } });
      try {
        await ava.source(source);
        const discover = vi.spyOn(ava.engine!, 'schema');
        expect(await ava.semantic()).toEqual({});
        const definitions: Semantic = {
          description: 'Sales definitions',
          properties: { currency: 'USD' },
          models: [
            {
              ...schema.models[0],
              properties: { description: 'Values' },
              columns: [{ name: 'value', type: 'number', properties: { unit: 'USD' } }],
            },
          ],
          relationships: [],
          views: [{ name: 'positive_values', statement: 'SELECT * FROM data WHERE value > 0' }],
          cubes: [
            {
              name: 'values',
              baseObject: 'data',
              measures: [{ name: 'total', expression: 'SUM(value)', type: 'DOUBLE' }],
            },
          ],
        };
        const expected = structuredClone(definitions);
        const options = {};
        const setter = vi.fn(() => definitions);
        const onSemantic = vi.fn();
        ava.on('semanticstart', onSemantic);
        ava.on('semanticend', onSemantic);
        expect(await ava.semantic(options, setter)).toEqual(expected);
        expect(setter).toHaveBeenCalledExactlyOnceWith(options);
        expect(discover).not.toHaveBeenCalled();
        expect(onSemantic.mock.calls.map(([event]) => event)).toEqual([
          { type: 'semanticstart', data: {} },
          { type: 'semanticend', data: {} },
        ]);
        definitions.description = 'changed';
        definitions.models[0].columns[0].properties.unit = 'changed';
        expect(await ava.semantic()).toEqual(expected);
        expect(onSemantic).toHaveBeenCalledTimes(2);

        await ava.schema();
        await ava.profile(undefined, () => profile);
        const dsl =
          type === 'duckdb'
            ? 'SELECT SUM(value) AS total FROM data'
            : 'const result = [{ total: stat.sum(data, "value") }];';
        const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue(dsl);
        const suggest = vi.spyOn(suggestions, 'generateSuggestions').mockResolvedValue([]);
        await ava.translate('Total');
        const context = getDSL.mock.calls[0][1];
        const snapshot = structuredClone(context);
        expect(context).toMatchObject(expected);
        expect(context.models[0].metrics).toEqual({ row_count: 2 });
        expect(context.models[0].columns[0]).toMatchObject({
          metrics: { mean: 3 },
          properties: { logicalType: 'numeric', unit: 'USD' },
        });
        expect(
          (await ava.analyze('Total', { includeSummary: false, strategy: { type: 'direct', maxRetries: 0 } })).data
        ).toEqual([{ total: 6 }]);
        expect(getDSL).toHaveBeenLastCalledWith('Total', context, expect.any(Function));
        await ava.suggest();
        expect(suggest).toHaveBeenCalledExactlyOnceWith(llm, context, 3, expect.any(Function));
        await ava.profile({ metrics: ['sum'] });
        await ava.translate('Total');
        expect(getDSL.mock.calls.at(-1)[1].models[0].columns[0].metrics).toEqual({ sum: 6 });
        expect(await ava.semantic()).toEqual(expected);

        await ava.semantic(undefined, () => ({}));
        await ava.translate('Total');
        expect(getDSL.mock.calls.at(-1)[1]).not.toHaveProperty('cubes');
        expect(getDSL.mock.calls[0][1]).toEqual(snapshot);
      } finally {
        await ava.dispose();
      }
    }
  );

  it('keeps semantic definitions when a setter throws or returns invalid metadata', async () => {
    const ava = new AVA({ llm, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      const setter = vi.fn(() => ({ description: 'Original' }));
      await ava.semantic(undefined, setter);
      expect(setter).toHaveBeenCalledExactlyOnceWith({});
      const onEnd = vi.fn();
      ava.on('semanticend', onEnd);
      const error = new Error('setter failed');
      await expect(
        ava.semantic(undefined, () => {
          throw error;
        })
      ).rejects.toBe(error);
      await expect(
        ava.semantic(undefined, () => ({ cubes: [{ name: 'invalid', measures: [] }] } as never))
      ).rejects.toThrow();
      expect(onEnd.mock.calls[0][0].data.error.message).toBe(error.message);
      expect(onEnd.mock.calls[1][0].data.error.name).toBe('ZodError');
      expect(await ava.semantic()).toEqual({ description: 'Original' });
    } finally {
      await ava.dispose();
    }
  });

  it.each(['duckdb', 'javascript'])(
    'reuses an exported profile with %s and recomputes only on request',
    async (type) => {
      const original = new AVA({ llm, engine: { type } });
      const restored = new AVA({ llm, engine: { type } });
      try {
        await original.source(source);
        const exported = JSON.parse(JSON.stringify(await original.profile()));
        const expectedSchema = await original.schema();
        const expectedProfile = structuredClone(exported);
        const discover =
          type === 'duckdb' ? vi.spyOn(duckdbSchema, 'getDuckDBSchema') : vi.spyOn(memorySchema, 'extractDataSchema');
        const onProfile = vi.fn();
        restored.on('profilestart', onProfile);
        await restored.source(source);
        await restored.schema(undefined, () => expectedSchema);
        await restored.profile(undefined, () => exported);
        expect(discover).not.toHaveBeenCalled();
        expect(onProfile).toHaveBeenCalledOnce();
        expect(await restored.schema()).toEqual(expectedSchema);
        expect(await restored.schema()).not.toHaveProperty('generatedAt');
        expect((await restored.schema()).models[0].columns[0]).not.toHaveProperty('metrics');
        const dsl =
          type === 'duckdb'
            ? 'SELECT SUM(value) AS total FROM data'
            : 'const result = [{total: stat.sum(data, "value")}];';
        const getDSL = vi.spyOn(restored.engine!, 'getDSL').mockResolvedValue(dsl);
        const suggest = vi.spyOn(suggestions, 'generateSuggestions').mockResolvedValue([]);
        const compute = vi.spyOn(restored.engine!, 'profile');
        exported.models[0].columns[0].name = 'changed by caller';
        exported.models[0].metrics.row_count = 999;
        await restored.translate('Total');
        expect(getDSL).toHaveBeenLastCalledWith(
          'Total',
          buildDataModel({ schema: expectedSchema, profile: expectedProfile }),
          expect.any(Function)
        );
        const analysis = await restored.analyze('Total', {
          includeSummary: false,
          strategy: { type: 'direct', maxRetries: 0 },
        });
        expect(analysis.data).toEqual([{ total: 6 }]);
        expect(getDSL).toHaveBeenLastCalledWith(
          'Total',
          buildDataModel({ schema: expectedSchema, profile: expectedProfile }),
          expect.any(Function)
        );
        await restored.suggest();
        expect(suggest).toHaveBeenLastCalledWith(
          llm,
          buildDataModel({ schema: expectedSchema, profile: expectedProfile }),
          3,
          expect.any(Function)
        );
        expect(compute).not.toHaveBeenCalled();
        const recomputed = await restored.profile({ metrics: ['sum'] });
        expect(recomputed.models[0].columns[0].metrics).toEqual({ sum: 6 });
        await restored.translate('Total');
        expect(getDSL).toHaveBeenLastCalledWith(
          'Total',
          buildDataModel({ schema: expectedSchema, profile: recomputed }),
          expect.any(Function)
        );
        expect(compute).toHaveBeenCalledExactlyOnceWith(expectedSchema, { metrics: ['sum'] });

        await restored.source(source);
        await restored.schema(undefined, () => expectedSchema);
        const nextDSL = vi.spyOn(restored.engine!, 'getDSL').mockResolvedValue(dsl);
        await restored.translate('Total');
        expect(nextDSL).toHaveBeenLastCalledWith('Total', expectedSchema, expect.any(Function));
        expect(discover).not.toHaveBeenCalled();
        await restored.source(source);
        expect(discover).not.toHaveBeenCalled();
        await restored.schema();
        await restored.schema();
        expect(discover).toHaveBeenCalledOnce();
      } finally {
        await original.dispose();
        await restored.dispose();
      }
    }
  );

  it('passes options to setters and overrides cached metadata without engine calls', async () => {
    const ava = new AVA({ llm, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      await ava.schema();
      await ava.profile();
      const discover = vi.spyOn(ava.engine!, 'schema');
      const compute = vi.spyOn(ava.engine!, 'profile');
      const options = {};
      const setSchema = vi.fn(() => schema);
      expect(await ava.schema(options, setSchema)).toEqual(schema);
      expect(setSchema).toHaveBeenCalledExactlyOnceWith(options);
      const profileOptions = { metrics: ['mean'] };
      const setProfile = vi.fn(() => profile);
      expect(await ava.profile(profileOptions, setProfile)).toEqual(profile);
      expect(setProfile).toHaveBeenCalledExactlyOnceWith(profileOptions);
      expect(discover).not.toHaveBeenCalled();
      expect(compute).not.toHaveBeenCalled();
      await ava.profile(profileOptions);
      expect(compute).toHaveBeenCalledExactlyOnceWith(schema, profileOptions);
    } finally {
      await ava.dispose();
    }
  });

  it('allows a profile setter without engine profiling support', async () => {
    const ava = new AVA({ llm, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      ava.engine!.profile = undefined;
      expect(await ava.profile(undefined, () => profile)).toEqual(profile);
      await expect(ava.profile()).rejects.toThrow('Profiling is not supported');
    } finally {
      await ava.dispose();
    }
  });

  it('reports setter failures and keeps the previous metadata', async () => {
    const ava = new AVA({ llm, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      await ava.schema(undefined, () => schema);
      await ava.profile(undefined, () => profile);
      const schemaEnd = vi.fn();
      const profileEnd = vi.fn();
      ava.on('schemaend', schemaEnd);
      ava.on('profileend', profileEnd);
      const error = new Error('setter failed');
      await expect(
        ava.schema(undefined, () => {
          throw error;
        })
      ).rejects.toBe(error);
      await expect(
        ava.profile(undefined, () => {
          throw error;
        })
      ).rejects.toBe(error);
      await expect(ava.schema(undefined, () => ({ models: 'invalid' } as never))).rejects.toThrow();
      await expect(ava.profile(undefined, () => ({ models: 'invalid' } as never))).rejects.toThrow();
      expect(schemaEnd.mock.calls[0][0].data.error.message).toBe('setter failed');
      expect(profileEnd.mock.calls[0][0].data.error.message).toBe('setter failed');
      expect(await ava.schema()).toEqual(schema);
      const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      await ava.translate('Rows');
      expect(getDSL).toHaveBeenLastCalledWith('Rows', buildDataModel({ schema, profile }), expect.any(Function));
      await ava.schema(undefined, () => schema);
      await ava.translate('Rows');
      expect(getDSL).toHaveBeenLastCalledWith('Rows', schema, expect.any(Function));
    } finally {
      await ava.dispose();
    }
  });

  it('clears supplied metadata on reload, failed load and disposal', async () => {
    const ava = new AVA({ llm, engine: { type: 'javascript' } });
    try {
      await expect(ava.schema(undefined, () => schema)).rejects.toThrow('No data loaded');
      await expect(ava.profile(undefined, () => profile)).rejects.toThrow('No data loaded');
      await expect(ava.semantic()).rejects.toThrow('No data loaded');
      await expect(ava.semantic(undefined, () => ({}))).rejects.toThrow('No data loaded');
      await ava.source(source);
      await ava.schema(undefined, () => schema);
      await ava.profile(undefined, () => profile);
      await ava.semantic(undefined, () => ({ description: 'Previous source' }));
      await ava.source(source);
      expect(await ava.semantic()).toEqual({});
      const discover = vi.spyOn(ava.engine!, 'schema');
      expect(discover).not.toHaveBeenCalled();
      const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      await ava.translate('Rows');
      expect(discover).toHaveBeenCalledOnce();
      expect(getDSL).toHaveBeenLastCalledWith('Rows', schema, expect.any(Function));
      await ava.schema(undefined, () => schema);
      await ava.profile(undefined, () => profile);
      await ava.semantic(undefined, () => ({ description: 'Failed source' }));
      await expect(ava.source({ type: 'parquet', options: { path: 'unsupported.parquet' } })).rejects.toThrow();
      expect(ava.engine).toBeNull();
      await expect(ava.schema()).rejects.toThrow('No data loaded');
      await ava.source(source);
      expect(await ava.semantic()).toEqual({});
      await ava.semantic(undefined, () => ({ description: 'Disposed source' }));
    } finally {
      await ava.dispose();
    }
    await expect(ava.profile(undefined, () => profile)).rejects.toThrow('No data loaded');
    await expect(ava.semantic()).rejects.toThrow('No data loaded');
    await ava.source(source);
    try {
      expect(await ava.semantic()).toEqual({});
    } finally {
      await ava.dispose();
    }
  });
});
