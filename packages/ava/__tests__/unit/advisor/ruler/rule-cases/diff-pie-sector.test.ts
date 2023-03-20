import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule, Info } from '../../../../../src/advisor/ruler';
import { diffPieSector } from '../../../../../src/advisor/ruler/rules/diff-pie-sector';

const applyChartTypes = ['pie_chart', 'donut_chart'];
const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

const dataProps = [
  {
    count: 3,
    distinct: 3,
    type: 'integer',
    recommendation: 'integer',
    missing: 0,
    rawData: [100, 120, 150],
    valueMap: { '100': 1, '120': 1, '150': 1 },
    minimum: 100,
    maximum: 150,
    mean: 123.33333333333333,
    percentile5: 100,
    percentile25: 100,
    percentile50: 120,
    percentile75: 150,
    percentile95: 150,
    sum: 370,
    variance: 422.2222222222222,
    standardDeviation: 20.548046676563253,
    zeros: 0,
    levelOfMeasurements: ['Interval', 'Discrete'],
    name: 'price',
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
    name: 'type',
  },
];

describe('Test: diff-pie-sector', () => {
  test('type', () => {
    expect(diffPieSector.type).toBe('SOFT');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        diffPieSector.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        diffPieSector.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  expect(
    (diffPieSector as ChartRuleModule).validator({
      chartType: 'pie_chart',
      dataProps: dataProps as Info['dataProps'],
    })
  ).toBe(0.405306694568926);
});
