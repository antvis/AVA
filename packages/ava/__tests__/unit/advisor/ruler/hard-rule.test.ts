import { aggregationSingleRow } from '../../../../src/advisor/ruler/rules/aggregation-single-row';
import { allCanBeTable } from '../../../../src/advisor/ruler/rules/all-can-be-table';

describe('Test all hard rules', () => {
  test('aggregation-single-row', () => {
    // @ts-ignore
    expect(
      aggregationSingleRow.validator({
        chartType: 'anyChart',
        dataProps: [{ count: 1, levelOfMeasurements: ['discrete'] }],
      })
    ).toBe(1);
  });

  test('all-can-be-table', () => {
    // @ts-ignore
    expect(allCanBeTable.validator({ weight: 1 })).toBe(1);
  });
});
