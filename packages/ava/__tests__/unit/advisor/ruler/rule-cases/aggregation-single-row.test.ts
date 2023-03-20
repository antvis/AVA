import { CHART_IDS } from '../../../../../src';
import { aggregationSingleRow } from '../../../../../src/advisor/ruler/rules/aggregation-single-row';

const applyChartTypes = CHART_IDS;

describe('Test: aggregation-single-row', () => {
  test('type', () => {
    expect(aggregationSingleRow.type).toBe('HARD');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        aggregationSingleRow.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });
  });
});
