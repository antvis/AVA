import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule, Info } from '../../../../../src/advisor/ruler';
import { lineFieldTimeOrdinal } from '../../../../../src/advisor/ruler/rules/line-field-time-ordinal';

const applyChartTypes = ['line_chart', 'area_chart', 'stacked_area_chart', 'percent_stacked_area_chart'];
const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

const dataProps = [
  {
    count: 9,
    distinct: 9,
    type: 'integer',
    recommendation: 'date',
    missing: 0,
    rawData: ['2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015'],
    valueMap: {
      '2007': 1,
      '2008': 1,
      '2009': 1,
      '2010': 1,
      '2011': 1,
      '2012': 1,
      '2013': 1,
      '2014': 1,
      '2015': 1,
    },
    minimum: '2007',
    maximum: '2015',
    levelOfMeasurements: ['Time'],
    name: 'year',
  },
  {
    count: 9,
    distinct: 9,
    type: 'integer',
    recommendation: 'integer',
    missing: 0,
    rawData: [28, 55, 43, 91, 81, 53, 19, 87, 52],
    valueMap: {
      '19': 1,
      '28': 1,
      '43': 1,
      '52': 1,
      '53': 1,
      '55': 1,
      '81': 1,
      '87': 1,
      '91': 1,
    },
    minimum: 19,
    maximum: 91,
    mean: 56.55555555555556,
    percentile5: 19,
    percentile25: 43,
    percentile50: 53,
    percentile75: 81,
    percentile95: 91,
    sum: 509,
    variance: 572.9135802469136,
    standardDeviation: 23.93561322061571,
    zeros: 0,
    levelOfMeasurements: ['Interval', 'Discrete'],
    name: 'sales',
  },
  {
    count: 9,
    distinct: 8,
    type: 'integer',
    recommendation: 'integer',
    missing: 0,
    rawData: [141, 187, 88, 108, 68, 90, 44, 123, 88],
    valueMap: {
      '44': 1,
      '68': 1,
      '88': 2,
      '90': 1,
      '108': 1,
      '123': 1,
      '141': 1,
      '187': 1,
    },
    minimum: 44,
    maximum: 187,
    mean: 104.11111111111111,
    percentile5: 44,
    percentile25: 88,
    percentile50: 90,
    percentile75: 123,
    percentile95: 187,
    sum: 937,
    variance: 1582.0987654320988,
    standardDeviation: 39.77560515481944,
    zeros: 0,
    levelOfMeasurements: ['Interval', 'Discrete'],
    name: 'amount',
  },
];

describe('Test: x-axis-line-fading', () => {
  test('type', () => {
    expect(lineFieldTimeOrdinal.type).toBe('SOFT');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        lineFieldTimeOrdinal.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        lineFieldTimeOrdinal.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  test('validator', () => {
    expect(
      (lineFieldTimeOrdinal as ChartRuleModule).validator({
        chartType: 'bar_chart',
        dataProps: dataProps as Info['dataProps'],
      })
    ).toBe(5);
  });
});
