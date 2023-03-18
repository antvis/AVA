import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a scatter_plot chart.
describe('should advise scatter_plot', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('scatter_plot');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type).toBe('scatter_plot');
  });
});
