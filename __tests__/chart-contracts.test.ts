import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { AVA, bindChartData, chartSpecSchema } from '../src/index.browser';
import { chartDefinitions } from '../src/visualization/vis';

import type { ChartSpec } from '../src/types';

const fixtures = {
  column: { data: [{ category: 'Jan', value: 10 }] },
  bar: { data: [{ category: 'Jan', value: 10 }] },
  line: { data: [{ time: 'Jan', value: 10 }] },
  area: { data: [{ time: 'Jan', value: 10 }] },
  pie: { data: [{ category: 'Jan', value: 10 }] },
  scatter: { data: [{ x: 1, y: 2 }] },
  histogram: { data: [1, 2, 3] },
  boxplot: { data: [{ category: 'A', value: 10 }] },
  violin: { data: [{ category: 'A', value: 10 }] },
  radar: { data: [{ name: 'A', value: 10 }] },
  funnel: { data: [{ category: 'A', value: 10 }] },
  waterfall: {
    data: [
      { category: 'A', value: -2 },
      { category: 'Total', isTotal: true },
    ],
  },
  liquid: { percent: 0.5 },
  'word-cloud': { data: [{ text: 'Hello', value: 10 }] },
  venn: { data: [{ sets: ['A', 'B'], value: 2 }] },
  treemap: { data: [{ name: 'Root', children: [{ name: 'Leaf', value: 10 }] }] },
  sankey: { data: [{ source: 'A', target: 'B', value: 10 }] },
  table: { data: [{ original: 'value' }] },
  'dual-axes': { categories: ['Jan'], series: [{ type: 'line', data: [10] }] },
};

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

  it.each([
    { chartType: 'column', config: { data: [{ month: 'Jan', revenue: 10 }] } },
    { chartType: 'column', config: { data: [{ category: 'Jan', value: '10' }] } },
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
