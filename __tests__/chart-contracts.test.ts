import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { AVA, bindChartData, chartSpecSchema } from '../src/index.browser';
import { chartDefinitions } from '../src/visualization/vis';

import { charts as fixtures } from './fixtures/charts';

import type { ChartSpec } from '../src/types';

describe('native chart contracts', () => {
  it('covers every advisor chart and renders each native data shape through the SDK', async () => {
    expect(z.toJSONSchema(chartSpecSchema, { io: 'input' }).oneOf).toHaveLength(19);
    expect(Object.keys(fixtures).sort()).toEqual(chartDefinitions.map((chart) => chart.type).sort());
    const ava = new AVA({ llm: { model: 'unused' } });
    for (const [chartType, config] of Object.entries(fixtures)) {
      const spec = chartSpecSchema.parse({ chartType, config: { ...config, customOption: true } });
      expect(spec.config.type).toBe(chartType);
      expect(spec.config.customOption).toBe(true);
      expect(await ava.viz(spec)).toContain(`"type":"${chartType}"`);
    }
  });

  it('retains native theme and presentation options without weakening the chart envelope', () => {
    const config = {
      ...fixtures.column,
      subtitle: 'Monthly revenue',
      theme: { id: 'brand', label: 'Brand', tokens: { colorDefault: '#1783FF' } },
      style: { mark: { interval: { radius: 4 } } },
    };
    expect(chartSpecSchema.parse({ chartType: 'column', config }).config).toMatchObject(config);
    expect(chartSpecSchema.parse({ chartType: 'column', config: { ...config, theme: 'midnight' } }).config.theme).toBe(
      'midnight'
    );
    expect(() => chartSpecSchema.parse({ chartType: 'column', config, hmtl: '' })).toThrow();
    expect(() => chartSpecSchema.parse({ chartType: 'column', config, html: 1 })).toThrow();
    expect(() =>
      chartSpecSchema.parse({ chartType: 'column', config: { ...config, style: { palette: 'blue' } } })
    ).toThrow();
  });

  it.each([
    { chartType: 'column', config: { data: [{ month: 'Jan', revenue: 10 }] } },
    { chartType: 'column', config: { data: [{ category: 'Jan', value: '10' }] } },
    { chartType: 'column', config: { data: [{ category: 1, value: 10 }] } },
    { chartType: 'line', config: { data: [{ time: 'Jan', value: 10, group: 1 }] } },
    { chartType: 'treemap', config: { data: [{ name: 'Root', children: [{ name: 'Leaf', value: 10 }] }] } },
    { chartType: 'line', config: { type: 'column', data: [{ time: 'Jan', value: 10 }] } },
    { chartType: 'liquid', config: { percent: 50 } },
    { chartType: 'pie', config: { data: [{ category: 'Jan', value: -1 }] } },
    { chartType: 'scatter', config: { data: [{ x: Infinity, y: 2 }] } },
    { chartType: 'dual-axes', config: { categories: ['Jan', 'Feb'], series: [{ type: 'line', data: [1] }] } },
  ])('rejects invalid native input in the SDK before producing HTML: %j', async (spec) => {
    const ava = new AVA({ llm: { model: 'unused' } });
    await expect(ava.viz(spec as unknown as ChartSpec)).rejects.toThrow();
  });
});

describe('explicit query-to-chart binding', () => {
  const result = { schema: [{ name: 'month' }, { name: 'revenue' }], data: [{ month: 'Jan', revenue: 10 }] };

  it('projects named fields without mutating the result or guessing columns', () => {
    const before = JSON.stringify(result);
    expect(
      bindChartData(
        result,
        { chartType: 'column', config: { title: 'Sales' } },
        {
          fields: { category: 'month', value: 'revenue' },
        }
      ).config
    ).toEqual({ type: 'column', title: 'Sales', data: [{ category: 'Jan', value: 10 }] });
    expect(JSON.stringify(result)).toBe(before);
    expect(() => bindChartData(result, { chartType: 'column' })).toThrow();
    expect(() => bindChartData(result, { chartType: 'column' }, { fields: { value: 'unknown' } })).toThrow(
      'Unknown result column'
    );
    expect(() =>
      bindChartData(
        { ...result, data: [{ month: 'Jan', revenue: '10' }] },
        { chartType: 'column' },
        {
          fields: { category: 'month', value: 'revenue' },
        }
      )
    ).toThrow();
  });

  it('validates bounded result metadata before binding native chart data', () => {
    for (const metadata of [{ rowCount: 2 }, { truncated: true }, { truncatedBy: 'maxRows' }]) {
      expect(() =>
        bindChartData(
          { ...result, ...metadata },
          { chartType: 'column' },
          { fields: { category: 'month', value: 'revenue' } }
        )
      ).toThrow(z.ZodError);
    }
    expect(() =>
      bindChartData(
        { schema: [{ name: 'month' }], data: [null] },
        { chartType: 'table' },
        { fields: { month: 'month' } }
      )
    ).toThrow(z.ZodError);
    expect(() =>
      bindChartData({ schema: [{ name: 'chart' }], data: [null] }, { chartType: 'liquid' }, { configField: 'chart' })
    ).toThrow(z.ZodError);
  });

  it('binds native interpreter values without requiring object rows', () => {
    expect(bindChartData({ schema: [], data: [1, 2, 3] }, { chartType: 'histogram' }).config).toEqual({
      type: 'histogram',
      data: [1, 2, 3],
    });
  });

  it('supports non-row native configs from one structured result cell', () => {
    const value = { schema: [{ name: 'chart' }], data: [{ chart: fixtures['dual-axes'] }] };
    expect(bindChartData(value, { chartType: 'dual-axes' }, { configField: 'chart' }).config).toMatchObject(
      fixtures['dual-axes']
    );
    expect(() =>
      bindChartData(
        { ...value, data: [...value.data, ...value.data] },
        { chartType: 'dual-axes' },
        { configField: 'chart' }
      )
    ).toThrow('exactly one');
    expect(() =>
      bindChartData(
        { ...value, data: [{ chart: JSON.stringify(fixtures['dual-axes']) }] },
        { chartType: 'dual-axes' },
        { configField: 'chart' }
      )
    ).toThrow();
    expect(() => bindChartData(result, { chartType: 'column', config: fixtures.column })).toThrow(
      'must come from the result'
    );
  });
});
