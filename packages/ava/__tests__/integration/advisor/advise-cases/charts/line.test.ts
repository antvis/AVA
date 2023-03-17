import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a line chart.
describe('should advise line', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('line_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type).toBe('line_chart');
  });
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('stacked_area_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('line_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a line chart.
describe('should NOT advise line', () => {
  test('categrorical field should not be x-axis of line chart', async () => {
    const data = await dataByChartId('bar_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'line_chart').toBe(false);
  });
});
