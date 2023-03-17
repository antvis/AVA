import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a area/line chart.
describe('should advise area/line', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('area_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('area_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a area/line chart.
describe('should NOT advise area/line', () => {
  test('categrorical field should not be x-axis of area chart', async () => {
    const data = await dataByChartId('bar_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'area_chart').toBe(false);
  });
});
