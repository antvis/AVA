import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a percent_stacked_bar chart.
describe('should advise percent_stacked_bar', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('percent_stacked_bar_chart');
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('percent_stacked_bar_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a percent_stacked_bar chart.
describe('should NOT advise bar/bar', () => {
  test('categrorical field should not be x-axis of bar chart', async () => {
    const data = await dataByChartId('line_chart');
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'percent_stacked_bar_chart').toBe(false);
  });
});
