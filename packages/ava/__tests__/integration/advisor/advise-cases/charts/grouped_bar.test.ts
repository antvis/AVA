import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a grouped_bar chart.
describe('should advise grouped_bar', () => {
  test('test case from @antv/data-samples', async () => {
    // TO DO  grouped_bar_chart dataset can not be used for now, because time field will lead to line chart
    // const data = await dataByChartId('grouped_bar_chart');
    const data = await dataByChartId('stacked_bar_chart');
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('grouped_bar_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a grouped_bar chart.
describe('should NOT advise bar/bar', () => {
  test('categrorical field should not be x-axis of bar chart', async () => {
    const data = await dataByChartId('line_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'grouped_bar_chart').toBe(false);
  });
});
