import { runInNewContext } from 'node:vm';

import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { AVA, executionResultSchema, sourceConfigSchema } from '../src/index.browser';
import * as node from '../src';
import * as browser from '../src/index.browser';
import * as contracts from '../src/schema';
import { startupSchema } from '../src/cli/session/protocol';
import { resultSchema as pythonResultSchema } from '../src/interpreter/python/util/schema';

import type { DataSourceConfig } from '../src/types';

const source = { type: 'json' as const, options: { data: [{ sales: 10 }] } };

describe('public source contracts', () => {
  it.each([null, [], 1, 'row', new Date()])('rejects non-record JSON rows: %j', (row) => {
    expect(() => sourceConfigSchema.parse({ type: 'json', options: { data: [row] } })).toThrow(z.ZodError);
  });

  it.each([
    { type: 'csv', options: { csv: 'value\n1', options: { header: 'true' } } },
    { type: 'csv-file', options: { path: 'sales.csv', options: { types: [1] } } },
    { type: 'json', options: { data: [], options: { records: true } } },
    { type: 'json-file', options: { path: 'sales.json', options: { format: 'csv' } } },
  ])('rejects malformed native reader options before loading: %j', (config) => {
    expect(() => sourceConfigSchema.parse(config)).toThrow(z.ZodError);
    expect(() => startupSchema.parse({ source: config, llm: { model: 'unused' } })).toThrow(z.ZodError);
  });

  it('uses the same source contract in SDK and CLI without erasing the discriminant', async () => {
    const schema = z.toJSONSchema(sourceConfigSchema, { io: 'input' });
    expect(schema.oneOf).toHaveLength(16);
    const json = schema.oneOf!.find((source) => source.properties?.type.const === 'json');
    expect(json?.properties?.options.properties?.data.items).toMatchObject({
      type: 'object',
      additionalProperties: {},
    });
    const parsed = sourceConfigSchema.parse(source);
    if (parsed.type === 'json') expect(parsed.options.data).toEqual(source.options.data);
    expect(startupSchema.parse({ source, llm: { model: 'unused' } }).source).toEqual(parsed);
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      await expect(
        ava.source({ type: 'json', options: { data: null } } as unknown as DataSourceConfig)
      ).rejects.toThrow();
      await expect(
        ava.source({
          type: 'mysql',
          options: { host: 'db', database: 'sales', ssh: { host: 'bastion', user: 'reader' } },
        } as unknown as DataSourceConfig)
      ).rejects.toThrow(/hostKeyFingerprint/);
      await expect(
        ava.source({
          type: 'snowflake',
          options: { account: 'org-account', database: 42 },
        } as unknown as DataSourceConfig)
      ).rejects.toThrow();
      expect((await ava.query('const result = data;')).data).toEqual(source.options.data);
    } finally {
      await ava.dispose();
    }
  });
});

describe('public result contract', () => {
  it('preserves engine types, large integer strings and analysis metadata without coercion', () => {
    const result = {
      schema: [{ name: 'total', type: 'BIGINT' }],
      data: [{ total: '9007199254740993' }],
      rowCount: 1,
      query: 'Total?',
    };
    expect(executionResultSchema.parse(result)).toEqual(result);
    expect(executionResultSchema.parse({ schema: [], data: [1, null, [2]], rowCount: 3 }).data).toEqual([1, null, [2]]);
    expect(
      executionResultSchema.parse({ schema: [], data: [], truncated: true, truncatedBy: 'maxResultBytes' })
    ).toMatchObject({ truncated: true });
  });

  it.each([
    { truncated: true },
    { truncatedBy: 'maxRows' },
    { rowCount: -1 },
    { rowCount: 1 },
    { truncated: true, truncatedBy: 'maxRows', rowCount: 0 },
  ])('rejects inconsistent result limits: %j', (limits) => {
    expect(() => executionResultSchema.parse({ schema: [], data: [], ...limits })).toThrow();
    expect(() => pythonResultSchema.parse({ schema: [], data: [], ...limits })).toThrow();
  });
});

describe('source-to-chart contract flow', () => {
  it.each(['javascript', 'duckdb'])(
    'preserves prototype-like column names through %s and chart binding',
    async (type) => {
      const data = JSON.parse('[{"__proto__":"A","constructor":"B","prototype":"C","value":10}]');
      const source = { type: 'json' as const, options: { data } };
      expect(sourceConfigSchema.parse(source)).toEqual(source);
      expect(startupSchema.parse({ source, llm: { model: 'unused' } }).source).toEqual(source);
      const ava = new node.AVA({ llm: { model: 'unused' }, engine: { type } });
      try {
        await ava.source(source);
        const result = await ava.query(type === 'duckdb' ? 'SELECT * FROM data' : 'const result = data;');
        expect(Object.entries(result.data[0])).toEqual(Object.entries(data[0]));
        expect(Object.getPrototypeOf(result.data[0])).toBe(Object.prototype);
        const table = node.bindChartData(result, { chartType: 'table' });
        expect(table.config).toMatchObject({ data });
        const column = node.bindChartData(
          result,
          { chartType: 'column' },
          { fields: { category: '__proto__', value: 'value' } }
        );
        expect(column.config).toMatchObject({ data: [{ category: 'A', value: 10 }] });
        const html = await ava.viz(table);
        expect(runInNewContext(`(${html.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 }).data).toEqual(
          data
        );
        expect(Object.entries(data[0])).toEqual([
          ['__proto__', 'A'],
          ['constructor', 'B'],
          ['prototype', 'C'],
          ['value', 10],
        ]);
      } finally {
        await ava.dispose();
      }
    }
  );

  it('exposes shared contracts and helpers from Node and browser entry points', () => {
    for (const [name, schema] of Object.entries(contracts)) {
      if (name.endsWith('InputSchema') || name.endsWith('OutputSchema')) {
        expect(node).toHaveProperty(name, schema);
        expect(browser).toHaveProperty(name, schema);
      }
    }
    expect(node.sourceConfigSchema).toBe(browser.sourceConfigSchema);
    expect(node.executionResultSchema).toBe(browser.executionResultSchema);
    expect(node.chartSpecSchema).toBe(browser.chartSpecSchema);
    expect(contracts.sourceConfigSchema).toBe(node.sourceConfigSchema);
    expect(contracts.executionResultSchema).toBe(node.executionResultSchema);
    expect(contracts.chartSpecSchema).toBe(node.chartSpecSchema);
    expect(contracts.schemaMetadataSchema.parse({ models: [] })).toEqual({ models: [] });
    expect(contracts.profileMetadataSchema.parse({ models: [] })).toEqual({ models: [] });
    expect(contracts.semanticMetadataSchema.parse({ description: 'Sales' })).toEqual({ description: 'Sales' });
    expect(contracts.dataModelMetadataSchema.parse({ description: 'Sales' })).toEqual({ description: 'Sales' });
    expect(contracts.bindingSchema.parse({ fields: { value: 'sales' } })).toEqual({ fields: { value: 'sales' } });
    expect(node.bindChartData).toBe(browser.bindChartData);
    expect(node.inferFileSourceType).toBe(browser.inferFileSourceType);
  });

  it('loads, queries, binds and renders real SQL results through the public contracts', async () => {
    const ava = new node.AVA({ llm: { model: 'unused' } });
    const data = [
      { month: 'Jan', revenue: 10 },
      { month: 'Feb', revenue: 20 },
    ];
    const config = sourceConfigSchema.parse({ type: 'json', options: { data } });
    try {
      await ava.source(config);
      const result = executionResultSchema.parse(await ava.query('SELECT month, revenue FROM data ORDER BY revenue'));
      const before = JSON.stringify(result);
      const spec = node.bindChartData(
        result,
        { chartType: 'column' },
        { fields: { category: 'month', value: 'revenue' } }
      );
      const html = await ava.viz(spec);
      expect(runInNewContext(`(${html.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 })).toEqual({
        type: 'column',
        data: [
          { category: 'Jan', value: 10 },
          { category: 'Feb', value: 20 },
        ],
      });
      expect(JSON.stringify(result)).toBe(before);
      expect(data).toEqual([
        { month: 'Jan', revenue: 10 },
        { month: 'Feb', revenue: 20 },
      ]);

      const partial = await ava.query('SELECT month, revenue FROM data ORDER BY revenue', { maxRows: 1 });
      expect(partial).toMatchObject({ truncated: true, truncatedBy: 'maxRows' });
      expect(
        node.bindChartData(partial, { chartType: 'column' }, { fields: { category: 'month', value: 'revenue' } }).config
          .data
      ).toEqual([{ category: 'Jan', value: 10 }]);
      expect(partial.truncated).toBe(true);

      const strings = await ava.query('SELECT month, CAST(revenue AS VARCHAR) AS revenue FROM data');
      expect(() =>
        node.bindChartData(strings, { chartType: 'column' }, { fields: { category: 'month', value: 'revenue' } })
      ).toThrow(z.ZodError);
    } finally {
      await ava.dispose();
    }
  });
});

describe('API input and output contracts', () => {
  it('keeps existing runtime exports as aliases', () => {
    expect(contracts.sourceInputSchema).toBe(contracts.sourceConfigSchema);
    expect(contracts.schemaOutputSchema).toBe(contracts.schemaMetadataSchema);
    expect(contracts.profileOutputSchema).toBe(contracts.profileMetadataSchema);
    expect(contracts.semanticOutputSchema).toBe(contracts.semanticMetadataSchema);
    expect(contracts.queryOutputSchema).toBe(contracts.executionResultSchema);
    expect(contracts.vizInputSchema).toBe(contracts.chartSpecSchema);
  });

  it('describes serializable API arguments without transport-specific fields or limits', () => {
    expect(contracts.sourceInputSchema.parse(source)).toEqual(source);
    expect(contracts.schemaInputSchema.parse({})).toEqual({});
    expect(contracts.semanticInputSchema.parse({})).toEqual({});
    expect(contracts.profileInputSchema.parse({ metrics: ['row_count', { id: 'top_values', limit: 2 }] })).toEqual({
      metrics: ['row_count', { id: 'top_values', limit: 2 }],
    });
    // SDK execution budgets are normalized by the engines, independently of CLI caps.
    expect(contracts.queryInputSchema.parse({ dsl: 'SELECT 1', options: { maxRows: 20000.5 } })).toEqual({
      dsl: 'SELECT 1',
      options: { maxRows: 20000.5 },
    });
    expect(
      contracts.analyzeInputSchema.parse({
        query: 'Sales',
        config: {
          includeSummary: false,
          strategy: { type: 'loop', maxSteps: 0 },
        },
      })
    ).toEqual({ query: 'Sales', config: { includeSummary: false, strategy: { type: 'loop', maxSteps: 0 } } });
    expect(contracts.translateInputSchema.parse('Sales')).toBe('Sales');
    expect(contracts.suggestInputSchema.parse(3)).toBe(3);
    const analysis = { query: 'Sales', data: [], schema: [] };
    expect(contracts.recommendInputSchema.parse(analysis)).toEqual({ query: 'Sales', data: [] });
    expect(contracts.visualizeInputSchema).toBe(contracts.recommendInputSchema);
    expect(contracts.queryInputSchema.safeParse({ dsl: 'SELECT 1', dataset: 'session' }).success).toBe(false);
    expect(contracts.profileInputSchema.safeParse({ metrics: [{ limit: 2 }] }).success).toBe(false);
    expect(
      contracts.analyzeInputSchema.safeParse({ query: 'Sales', config: { strategy: { type: 'unknown' } } }).success
    ).toBe(false);
  });

  it('validates analysis metadata with the same bounded-result rules as query', () => {
    const output = { query: 'Sales', text: '', sql: 'SELECT 1', schema: [], data: [1], rowCount: 1 };
    expect(contracts.analyzeOutputSchema.parse(output)).toEqual(output);
    for (const invalid of [
      { ...output, rowCount: 2 },
      { ...output, truncated: true },
      { ...output, truncated: true, truncatedBy: 'maxRows' },
    ])
      expect(contracts.analyzeOutputSchema.safeParse(invalid).success).toBe(false);
    expect(
      contracts.analyzeOutputSchema.parse({ ...output, rowCount: undefined, truncated: true, truncatedBy: 'maxRows' })
    ).toMatchObject({ truncated: true });
  });

  it('preserves nullable chart results and requires HTML for visualizations', () => {
    const spec = { chartType: 'column', config: { data: [{ category: 'A', value: 1 }] } };
    const normalized = contracts.vizInputSchema.parse(spec);
    expect(normalized.config).toMatchObject({ type: 'column' });
    expect(contracts.recommendOutputSchema.parse(null)).toBeNull();
    expect(contracts.visualizeOutputSchema.parse(null)).toBeNull();
    expect(contracts.recommendOutputSchema.parse(spec)).toEqual(normalized);
    expect(contracts.visualizeOutputSchema.safeParse(spec).success).toBe(false);
    expect(contracts.visualizeOutputSchema.parse({ ...spec, html: '<html></html>' })).toEqual({
      ...normalized,
      html: '<html></html>',
    });
    expect(
      contracts.visualizeOutputSchema.parse({ chartType: 'summary', config: '# Sales', html: '<html></html>' })
    ).toMatchObject({ chartType: 'summary' });
    expect(
      contracts.visualizeOutputSchema.safeParse({
        chartType: 'dual-axes',
        config: {
          categories: ['A'],
          series: [{ type: 'line', data: [1, 2] }],
        },
        html: '',
      }).success
    ).toBe(false);
    expect(contracts.vizOutputSchema.parse('<html></html>')).toBe('<html></html>');
    expect(contracts.translateOutputSchema.parse('SELECT 1')).toBe('SELECT 1');
    expect(contracts.suggestOutputSchema.parse([{ query: 'Sales?', score: 1, reason: 'Trend' }])).toHaveLength(1);
    expect(contracts.suggestOutputSchema.safeParse([{ query: 'Sales?', score: 2, reason: 'Trend' }]).success).toBe(
      false
    );
  });

  it('exports JSON Schema in the corresponding input/output mode', () => {
    for (const [name, schema] of Object.entries(contracts)) {
      if (!name.endsWith('InputSchema') && !name.endsWith('OutputSchema')) continue;
      expect(z.toJSONSchema(schema, { io: name.endsWith('InputSchema') ? 'input' : 'output' })).toBeDefined();
    }
    const input = z.toJSONSchema(contracts.vizInputSchema, { io: 'input' });
    const output = z.toJSONSchema(contracts.recommendOutputSchema, { io: 'output' });
    const inputColumn = input.oneOf!.find((schema) => schema.properties?.chartType.const === 'column');
    const outputColumn = output.anyOf![0].oneOf!.find((schema) => schema.properties?.chartType.const === 'column');
    expect(inputColumn?.properties?.config.required).not.toContain('type');
    expect(outputColumn?.properties?.config.required).toContain('type');
  });
});
