import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a bubble chart.
describe('should advise bubble', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('bubble_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });

    expect(advices.map((advice) => advice.type).includes('bubble_chart')).toBe(true);
  });
});
