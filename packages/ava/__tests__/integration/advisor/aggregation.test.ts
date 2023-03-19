import { Advisor } from '../../../src/advisor/index';

// In the following cases, the recommended result should be a bar chart.
describe('data should be aggregated', () => {
  test('test case from https://github.com/antvis/AVA/issues/157', () => {
    const data = [
      { btag: 'fav', count: 997815 },
      { btag: 'pv', count: 1135028 },
      { btag: 'buy', count: 5388715 },
      { btag: 'buy', count: 2 },
    ];

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });
    expect(advices?.[0].spec.data.length === 3).toBe(true);
  });
});
