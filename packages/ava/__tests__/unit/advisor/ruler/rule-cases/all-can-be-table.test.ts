import { CHART_IDS } from '../../../../../src';
import { ChartRuleModule } from '../../../../../src/advisor/ruler';
import { allCanBeTable } from '../../../../../src/advisor/ruler/rules/all-can-be-table';

const applyChartTypes = ['table'];
const notApplyChartTypes = CHART_IDS.filter((chartType) => !applyChartTypes.includes(chartType));

describe('Test: all-can-be-table', () => {
  test('type', () => {
    expect(allCanBeTable.type).toBe('HARD');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        allCanBeTable.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });

    notApplyChartTypes.forEach((chartType) => {
      expect(
        allCanBeTable.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(false);
    });
  });

  test('validator', () => {
    expect(
      (allCanBeTable as ChartRuleModule).validator({
        weight: 1,
        dataProps: undefined,
      })
    ).toBe(1);
  });
});
