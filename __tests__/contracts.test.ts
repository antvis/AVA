import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { AVA, executionResultSchema, sourceConfigSchema } from '../src/index.browser';
import * as node from '../src';
import * as browser from '../src/index.browser';
import { startupSchema } from '../src/cli/session/protocol';

import type { DataSourceConfig } from '../src/types';

const source = { type: 'json' as const, options: { data: [{ sales: 10 }] } };

describe('public source contracts', () => {
  it('uses the same source contract in SDK and CLI without erasing the discriminant', async () => {
    expect(z.toJSONSchema(sourceConfigSchema, { io: 'input' }).oneOf).toHaveLength(15);
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
  });
});

describe('source-to-chart contract flow', () => {
  it('exposes shared contracts and helpers from Node and browser entry points', () => {
    expect(node.sourceConfigSchema).toBe(browser.sourceConfigSchema);
    expect(node.executionResultSchema).toBe(browser.executionResultSchema);
    expect(node.chartSpecSchema).toBe(browser.chartSpecSchema);
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
      expect(JSON.parse(html.match(/const visConfig = (.+);/)![1])).toEqual({
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
