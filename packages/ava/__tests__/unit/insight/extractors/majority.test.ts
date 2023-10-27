import { insightPatternsExtractor } from '../../../../src/insight/insights';

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
    sales: 473,
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

describe('extract majority insight', () => {
  test('check majority result', () => {
    const result = insightPatternsExtractor({
      data,
      dimensions: ['type'],
      measures: [{ fieldName: 'sales', method: 'SUM' }],
      insightType: 'majority',
      options: {
        filterInsight: true,
      },
    });
    expect(result[0]?.index).toEqual(5);
  });
});
