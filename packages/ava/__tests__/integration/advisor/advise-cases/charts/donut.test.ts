import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a donut chart.
describe('should advise donut', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('donut_chart');

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('donut_chart')).toBe(true);
  });

  test('a categorical field + a quantitative field with significantly different values', () => {
    const data = [
      { price: 100, type: 'A' },
      { price: 120, type: 'B' },
      { price: 150, type: 'C' },
    ];

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices.map((advice) => advice.type).includes('donut_chart')).toBe(true);
  });
});
