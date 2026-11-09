import { runInNewContext } from 'node:vm';

import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { AVA, vizInputSchema } from '../src/index.browser';
import { chartDefinitions } from '../src/visualization/vis';

import { charts as fixtures } from './fixtures/charts';

import type { ChartSpec } from '../src/types';

describe('native chart contracts', () => {
  it('covers every advisor chart and renders each native data shape through the SDK', async () => {
    expect(z.toJSONSchema(vizInputSchema, { io: 'input' }).oneOf).toHaveLength(20);
    expect(Object.keys(fixtures).sort()).toEqual(chartDefinitions.map((chart) => chart.type).sort());
    const ava = new AVA({ llm: { model: 'unused' } });
    for (const [chartType, config] of Object.entries(fixtures)) {
      const spec = vizInputSchema.parse({ chartType, config: { ...config, customOption: true } });
      expect(spec.config.type).toBe(chartType);
      expect(spec.config.customOption).toBe(true);
      const html = await ava.viz(spec);
      expect(runInNewContext(`(${html.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 }).type).toBe(
        chartType
      );
    }
  });

  it('accepts native summary strings without adding summaries to automatic chart recommendations', async () => {
    const ava = new AVA({ llm: { model: 'unused' } });
    const spec = { chartType: 'summary' as const, config: '# Sales report\nRevenue increased by 10%.' };
    const html = await ava.viz(spec);
    expect(runInNewContext(`(${html.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 })).toBe(spec.config);
    expect(chartDefinitions.some((chart) => chart.type === 'summary')).toBe(false);
    expect(() => vizInputSchema.parse({ ...spec, config: { type: 'summary', text: 'Report' } })).toThrow();
    for (const config of ['', '   ', 'vis column\ndata\n  - category A\n    value 1']) {
      expect(() => vizInputSchema.parse({ ...spec, config })).toThrow();
    }
  });

  it('retains native theme and presentation options without weakening the chart envelope', () => {
    const config = {
      ...fixtures.column,
      subtitle: 'Monthly revenue',
      theme: { id: 'brand', label: 'Brand', tokens: { colorDefault: '#1783FF' } },
      style: { mark: { interval: { radius: 4 } } },
    };
    expect(vizInputSchema.parse({ chartType: 'column', config }).config).toMatchObject(config);
    expect(vizInputSchema.parse({ chartType: 'column', config: { ...config, theme: 'midnight' } }).config.theme).toBe(
      'midnight'
    );
    expect(() => vizInputSchema.parse({ chartType: 'column', config, hmtl: '' })).toThrow();
    expect(() => vizInputSchema.parse({ chartType: 'column', config, html: 1 })).toThrow();
    expect(() =>
      vizInputSchema.parse({ chartType: 'column', config: { ...config, style: { palette: 'blue' } } })
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
