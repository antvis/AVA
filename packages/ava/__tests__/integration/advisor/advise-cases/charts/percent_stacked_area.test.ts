import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a stacked_area chart.
describe('should advise stacked_area', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('percent_stacked_area_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('percent_stacked_area_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a stacked_area chart.
describe('should NOT advise stacked_area', () => {
  test('categrorical field should not be x-axis of stacked_area chart', async () => {
    const data = await dataByChartId('bar_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'percent_stacked_area_chart').toBe(false);
  });
});
