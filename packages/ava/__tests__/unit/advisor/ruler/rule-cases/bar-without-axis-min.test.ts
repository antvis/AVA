import { CHART_IDS } from '../../../../../src';
import { DesignRuleModule } from '../../../../../src/advisor/ruler';
import { barWithoutAxisMin } from '../../../../../src/advisor/ruler/rules/bar-without-axis-min';

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

const chartSpec = {
  type: 'line',
  data: [
    { price: 520, year: 2005 },
    { price: 600, year: 2006 },
    { price: 1500, year: 2007 },
  ],
  encode: {
    x: 'year',
    y: 'price',
  },
  scale: {
    x: {
      domainMin: 20,
    },
  },
};

describe('Test: bar-without-axis-min', () => {
  test('type', () => {
    expect(barWithoutAxisMin.type).toBe('DESIGN');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        barWithoutAxisMin.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        barWithoutAxisMin.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  test('optimizer', () => {
    const expectPartOfSpec = {
      scale: {
        x: {
          domainMin: 0,
        },
      },
    };
    expect((barWithoutAxisMin as DesignRuleModule).optimizer(undefined, chartSpec)).toStrictEqual(expectPartOfSpec);
  });
});
