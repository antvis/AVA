import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a bar chart.
describe('should advise bar/column', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('bar_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(
      !!advices.filter((advice) => {
        return advice.type === 'column_chart' || advice.type === 'bar_chart';
      })
    ).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a bar chart.
describe('should NOT advise bar/column', () => {
  test('categrorical field should not be x-axis of bar chart', async () => {
    const data = await dataByChartId('line_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'bar_chart').toBe(false);
    expect(advices[0].type === 'column_chart').toBe(false);
  });
});
