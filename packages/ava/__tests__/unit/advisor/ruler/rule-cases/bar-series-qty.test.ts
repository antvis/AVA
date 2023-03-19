import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule, Info } from '../../../../../src/advisor/ruler';
import { barSeriesQty } from '../../../../../src/advisor/ruler/rules/bar-series-qty';

const applyChartTypes = [
  'bar_chart',
  'grouped_bar_chart',
  'stacked_bar_chart',
  'percent_stacked_bar_chart',
  'column_chart',
  'grouped_column_chart',
  'stacked_column_chart',
  'percent_stacked_column_chart',
];
const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

describe('Test: bar-series-qty', () => {
  test('type', () => {
    expect(barSeriesQty.type).toBe('SOFT');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        barSeriesQty.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        barSeriesQty.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  test('validator', () => {
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
    ];
    expect(
      (barSeriesQty as ChartRuleModule).validator({
        chartType: 'bar_chart',
        dataProps: dataProps as Info['dataProps'],
      })
    ).toBe(1);
  });

  test('validator', () => {
    const dataProps = [
      {
        count: 21,
        distinct: 21,
        type: 'string',
        recommendation: 'string',
        missing: 0,
        rawData: [
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
          'i',
          'j',
          'k',
          'l',
          'm',
          'n',
          'o',
          'p',
          'q',
          'r',
          's',
          't',
          'u',
        ],
        valueMap: {
          a: 1,
          b: 1,
          c: 1,
          d: 1,
          e: 1,
          f: 1,
          g: 1,
          h: 1,
          i: 1,
          j: 1,
          k: 1,
          l: 1,
          m: 1,
          n: 1,
          o: 1,
          p: 1,
          q: 1,
          r: 1,
          s: 1,
          t: 1,
          u: 1,
        },
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
        count: 21,
        distinct: 1,
        type: 'integer',
        recommendation: 'integer',
        missing: 0,
        rawData: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        valueMap: { '10': 21 },
        minimum: 10,
        maximum: 10,
        mean: 10,
        percentile5: 10,
        percentile25: 10,
        percentile50: 10,
        percentile75: 10,
        percentile95: 10,
        sum: 210,
        variance: 0,
        standardDeviation: 0,
        zeros: 0,
        levelOfMeasurements: ['Interval', 'Discrete'],
        name: 'f2',
      },
    ];

    expect(
      (barSeriesQty as ChartRuleModule).validator({
        chartType: 'bar_chart',
        dataProps: dataProps as Info['dataProps'],
      })
    ).toBe(20 / 21);
  });
});
