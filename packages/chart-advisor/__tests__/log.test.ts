import { dataByChartId } from '@antv/data-samples';

import { Advisor, Linter, ChartAdvisor } from '../src';

import type { Specification } from '../src/types';

describe('Advisor export log', () => {
  let data: any;
  beforeAll(async () => {
    data = await dataByChartId('step_line_chart');
  });

  const myAdvisor = new Advisor();

  test('advisor without log', () => {
    const results = myAdvisor.advise({ data });
    expect(Array.isArray(results)).toBe(true);
    expect(Object.keys(results).includes('log')).toBe(false);
  });

  test('advisor with log', () => {
    const results = myAdvisor.adviseWithLog({ data });
    const { log } = results;
    expect(log && log.length > 0).toBe(true);
  });
});

describe('Linter export log', () => {
  const dataOfErrorSpec = {
    type: 'json-array',
    values: [
      { year: '2007', sales: 28, amount: 141 },
      { year: '2008', sales: 55, amount: 187 },
      { year: '2009', sales: 43, amount: 88 },
      { year: '2010', sales: 91, amount: 108 },
      { year: '2011', sales: 81, amount: 68 },
      { year: '2012', sales: 53, amount: 90 },
      { year: '2013', sales: 19, amount: 44 },
      { year: '2014', sales: 87, amount: 123 },
      { year: '2015', sales: 52, amount: 88 },
    ],
  };

  const partOfSpec = {
    basis: {
      type: 'chart',
    },
    layer: [
      {
        mark: 'area',
        encoding: {
          x: {
            field: 'year',
            type: 'temporal',
          },
          y: {
            field: 'sales',
            type: 'quantitative',
          },
        },
      },
    ],
  };

  const myLinter = new Linter();

  test('linter without log', () => {
    const results = myLinter.lint({ spec: { ...partOfSpec, data: dataOfErrorSpec } as Specification });
    expect(Array.isArray(results)).toBe(true);
    expect(Object.keys(results).includes('log')).toBe(false);
  });

  test('linter with log', () => {
    const results = myLinter.lintWithLog({ spec: { ...partOfSpec, data: dataOfErrorSpec } as Specification });
    const { log } = results;
    expect(log && log.length > 0).toBe(true);
  });
});

describe('ChartAdvisor export log', () => {
  let data: any;
  beforeAll(async () => {
    data = await dataByChartId('step_line_chart');
  });

  const myCA = new ChartAdvisor();

  test('ChartAdvisor without log', () => {
    const results = myCA.advise({ data });
    expect(Array.isArray(results)).toBe(true);
    expect(Object.keys(results).includes('log')).toBe(false);
  });

  test('ChartAdvisor with log', () => {
    const results = myCA.adviseWithLog({ data });
    const { log } = results;
    expect(log && log.length > 0).toBe(true);
  });
});
