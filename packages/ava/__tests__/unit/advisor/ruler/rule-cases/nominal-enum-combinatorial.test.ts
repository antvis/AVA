import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule, Info } from '../../../../../src/advisor/ruler';
import { nominalEnumCombinatorial } from '../../../../../src/advisor/ruler/rules/nominal-enum-combinatorial';

const applyChartTypes = [
  'bar_chart',
  'column_chart',
  'grouped_bar_chart',
  'grouped_column_chart',
  'stacked_bar_chart',
  'stacked_column_chart',
];
const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

const dataProps = [
  {
    count: 3,
    distinct: 3,
    type: 'string',
    recommendation: 'string',
    missing: 0,
    rawData: ['a', 'b', 'c'],
    valueMap: { a: 1, b: 1, c: 1 },
    maxLength: 1,
    minLength: 1,
    meanLength: 1,
    containsChar: true,
    containsDigit: false,
    containsSpace: false,
    levelOfMeasurements: ['Nominal'],
    name: 'f1',
  },
  {
    count: 3,
    distinct: 1,
    type: 'integer',
    recommendation: 'integer',
    missing: 0,
    rawData: [10, 10, 10],
    valueMap: { '10': 3 },
    minimum: 10,
    maximum: 10,
    mean: 10,
    percentile5: 10,
    percentile25: 10,
    percentile50: 10,
    percentile75: 10,
    percentile95: 10,
    sum: 30,
    variance: 0,
    standardDeviation: 0,
    zeros: 0,
    levelOfMeasurements: ['Interval', 'Discrete'],
    name: 'f2',
  },
  {
    count: 3,
    distinct: 3,
    type: 'string',
    recommendation: 'string',
    missing: 0,
    rawData: ['A', 'B', 'C'],
    valueMap: { A: 1, B: 1, C: 1 },
    maxLength: 1,
    minLength: 1,
    meanLength: 1,
    containsChar: true,
    containsDigit: false,
    containsSpace: false,
    levelOfMeasurements: ['Nominal'],
    name: 'f3',
  },
];

describe('Test: nominal-enum-combinatorial', () => {
  test('type', () => {
    expect(nominalEnumCombinatorial.type).toBe('SOFT');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        nominalEnumCombinatorial.trigger({
          chartType,
          dataProps: dataProps as Info['dataProps'],
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        nominalEnumCombinatorial.trigger({
          chartType,
          dataProps: dataProps as Info['dataProps'],
        })
      ).toBe(false);
    });
  });

  test('validator', () => {
    expect(
      (nominalEnumCombinatorial as ChartRuleModule).validator({
        chartType: 'bar_chart',
        dataProps: dataProps as Info['dataProps'],
      })
    ).toBe(5);
  });
});
