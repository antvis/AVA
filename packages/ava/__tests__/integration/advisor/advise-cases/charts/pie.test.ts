import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a pie chart.
describe('should advise pie', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('pie_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type).toBe('pie_chart');
  });

  test('a categorical field + a quantitative field with significantly different values', () => {
    const data = [
      { price: 100, type: 'A' },
      { price: 150, type: 'B' },
      { price: 200, type: 'C' },
    ];

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type).toBe('pie_chart');
  });
});

// In the following cases, the recommended result should NOT be a pie chart.
describe('should NOT advise pie', () => {
  test('a categorical field + a quantitative field with small difference', () => {
    const data = [
      { price: 100, type: 'A' },
      { price: 103, type: 'B' },
      { price: 107, type: 'C' },
    ];

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices[0].type === 'pie_chart').toBe(false);
  });
});
