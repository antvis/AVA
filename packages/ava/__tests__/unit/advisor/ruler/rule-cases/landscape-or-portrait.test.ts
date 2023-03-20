import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule } from '../../../../../src/advisor/ruler';
import { landscapeOrPortrait } from '../../../../../src/advisor/ruler/rules/landscape-or-portrait';

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

describe('Test: landscape-or-portrait', () => {
  test('type', () => {
    expect(landscapeOrPortrait.type).toBe('SOFT');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        landscapeOrPortrait.trigger({
          chartType,
          preferences: { canvasLayout: 'landscape' },
          // @ts-ignore
          dataProps: {},
        })
      ).toBe(true);
    });

    applyChartTypes.forEach((chartType) => {
      expect(
        landscapeOrPortrait.trigger({
          chartType,
          // @ts-ignore
          dataProps: {},
        })
      ).toBe(false);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        landscapeOrPortrait.trigger({
          chartType,
          // @ts-ignore
          dataProps: {},
        })
      ).toBe(false);
    });
  });

  test('validator', () => {
    expect(
      (landscapeOrPortrait as ChartRuleModule).validator({
        chartType: 'column_chart',
        // @ts-ignore
        dataProps: {},
        preferences: { canvasLayout: 'landscape' },
      })
    ).toBe(5);
  });

  test('validator', () => {
    expect(
      (landscapeOrPortrait as ChartRuleModule).validator({
        chartType: 'column_chart',
        // @ts-ignore
        dataProps: {},
        preferences: { canvasLayout: 'portrait' },
      })
    ).toBe(1);
  });

  test('validator', () => {
    expect(
      (landscapeOrPortrait as ChartRuleModule).validator({
        chartType: 'bar_chart',
        // @ts-ignore
        dataProps: {},
        preferences: { canvasLayout: 'portrait' },
      })
    ).toBe(5);
  });

  test('validator', () => {
    expect(
      (landscapeOrPortrait as ChartRuleModule).validator({
        chartType: 'bar_chart',
        // @ts-ignore
        dataProps: {},
        preferences: { canvasLayout: 'landscape' },
      })
    ).toBe(1);
  });
});
