import { CHART_IDS } from '../../../../../src';
import { DesignRuleModule, Info } from '../../../../../src/advisor/ruler';
import { xAxisLineFading } from '../../../../../src/advisor/ruler/rules/x-axis-line-fading';

const applyChartTypes = ['line_chart'];
const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

const chartSpec = {
  type: 'line',
  encode: { x: 'year', y: 'sales' },
  data: [
    { year: '2007', sales: 41 },
    { year: '2008', sales: 55 },
    { year: '2009', sales: 43 },
    { year: '2010', sales: 91 },
    { year: '2011', sales: 81 },
    { year: '2012', sales: 53 },
    { year: '2013', sales: 42 },
    { year: '2014', sales: 87 },
    { year: '2015', sales: 52 },
  ],
};

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
    rawData: [41, 55, 43, 91, 81, 53, 42, 87, 52],
    valueMap: {
      '41': 1,
      '42': 1,
      '43': 1,
      '52': 1,
      '53': 1,
      '55': 1,
      '81': 1,
      '87': 1,
      '91': 1,
    },
    minimum: 41,
    maximum: 91,
    mean: 60.55555555555556,
    percentile5: 41,
    percentile25: 43,
    percentile50: 53,
    percentile75: 81,
    percentile95: 91,
    sum: 545,
    variance: 360.0246913580247,
    standardDeviation: 18.974316624269363,
    zeros: 0,
    levelOfMeasurements: ['Interval', 'Discrete'],
    name: 'sales',
  },
];

describe('Test: x-axis-line-fading', () => {
  test('type', () => {
    expect(xAxisLineFading.type).toBe('DESIGN');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        xAxisLineFading.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        xAxisLineFading.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  const expectMapping = {
    axis: {
      x: {
        tick: false,
      },
    },
    clip: true,
    scale: {
      y: {
        domainMin: 31,
      },
    },
  };

  test('optimizer', () => {
    expect((xAxisLineFading as DesignRuleModule).optimizer(dataProps as Info['dataProps'], chartSpec)).toStrictEqual(
      expectMapping
    );
  });
});
