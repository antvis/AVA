import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a stacked_column chart.
describe('should advise stacked_column', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('stacked_column_chart');
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('stacked_column_chart')).toBe(true);
  });
});

// In the following cases, the recommended result should NOT be a stacked_column chart.
describe('should NOT advise column/column', () => {
  test('categrorical field should not be x-axis of column chart', async () => {
    const data = await dataByChartId('line_chart');
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'stacked_column_chart').toBe(false);
  });
});
