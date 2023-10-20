import { insightExtractor } from '../../../../src/insight/insights';

const data = [
  {
    type: 'A',
    sales: 38,
  },
  {
    type: 'B',
    sales: 52,
  },
  {
    type: 'C',
    sales: 48,
  },
  {
    type: 'D',
    sales: 45,
  },
  {
    type: 'E',
    sales: 48,
  },
  {
    type: 'F',
    sales: 38,
  },
  {
    type: 'G',
    sales: 38,
  },
  {
    type: 'H',
    sales: 38,
  },
];

describe('extract low-variance insight', () => {
  test('check low-variance result', () => {
    const result = insightExtractor({
      data,
      dimensions: ['type'],
      measures: [{ fieldName: 'sales', method: 'SUM' }],
      insightType: 'low_variance',
      options: {
        filterInsight: true,
      },
    });
    expect(result[0]?.significance).toBeGreaterThan(0.85);
  });
});
