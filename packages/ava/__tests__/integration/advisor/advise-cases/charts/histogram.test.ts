import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a histogram chart.
describe('should advise histogram', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('histogram');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type).toBe('histogram');
  });
});

// In the following cases, the recommended result should NOT be a histogram chart.
describe('should NOT advise histogram', () => {
  test('categrorical field should not be x-axis of histogram chart', async () => {
    const data = await dataByChartId('line_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'histogram').toBe(false);
  });
});
