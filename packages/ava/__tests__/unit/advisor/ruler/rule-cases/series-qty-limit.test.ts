import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule, Info } from '../../../../../src/advisor/ruler';
import { seriesQtyLimit } from '../../../../../src/advisor/ruler/rules/series-qty-limit';

const applyChartTypes = ['pie_chart', 'donut_chart', 'radar_chart', 'rose_chart'];

const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

describe('Test: bar-series-qty', () => {
  test('type', () => {
    expect(seriesQtyLimit.type).toBe('SOFT');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        seriesQtyLimit.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        seriesQtyLimit.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  test('validator', () => {
    const dataProps = [
      {
        count: 5,
        distinct: 5,
        type: 'string',
        recommendation: 'string',
        missing: 0,
        rawData: ['a', 'b', 'c', 'd', 'e'],
        valueMap: { a: 1, b: 1, c: 1, d: 1, e: 1 },
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
        count: 5,
        distinct: 1,
        type: 'integer',
        recommendation: 'integer',
        missing: 0,
        rawData: [10, 10, 10, 10, 10],
        valueMap: { '10': 5 },
        minimum: 10,
        maximum: 10,
        mean: 10,
        percentile5: 10,
        percentile25: 10,
        percentile50: 10,
        percentile75: 10,
        percentile95: 10,
        sum: 50,
        variance: 0,
        standardDeviation: 0,
        zeros: 0,
        levelOfMeasurements: ['Interval', 'Discrete'],
        name: 'f2',
      },
      {
        count: 5,
        distinct: 5,
        type: 'string',
        recommendation: 'string',
        missing: 0,
        rawData: ['a1', 'b1', 'c1', 'd1', 'e1'],
        valueMap: { a1: 1, b1: 1, c1: 1, d1: 1, e1: 1 },
        maxLength: 2,
        minLength: 2,
        meanLength: 2,
        containsChar: true,
        containsDigit: true,
        containsSpace: false,
        levelOfMeasurements: ['Ordinal'],
        name: 'f3',
      },
    ];

    expect(
      (seriesQtyLimit as ChartRuleModule).validator({
        chartType: 'pie_chart',
        dataProps: dataProps as Info['dataProps'],
      })
    ).toBe(5.4);
  });
});
