import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a line chart.
describe('should advise line', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('heatmap');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    // TODO heatmap is invalid in advisor for unknown reason
    expect(advices.map((advice) => advice.type).includes('heatmap')).toBe(true);
  });
});
