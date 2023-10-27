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
    sales: 61,
  },
  {
    type: 'D',
    sales: 145,
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

describe('extract category-outlier insight', () => {
  test('check outliers result', () => {
    const result = insightPatternsExtractor({
      data,
      dimensions: ['type'],
      measures: [{ fieldName: 'sales', method: 'SUM' }],
      insightType: 'category_outlier',
      options: {
        filterInsight: true,
      },
    });
    const outlierIndexes = result?.map((item) => item.index);
    expect(outlierIndexes).toStrictEqual([3]);
  });
});
