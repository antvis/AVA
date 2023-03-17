import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a step_line chart.
describe('should advise step_line', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('step_line_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('step_line_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a step_line chart.
describe('should NOT advise step_line', () => {
  test('categrorical field should not be x-axis of step_line chart', async () => {
    const data = await dataByChartId('bar_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'step_line_chart').toBe(false);
  });
});
