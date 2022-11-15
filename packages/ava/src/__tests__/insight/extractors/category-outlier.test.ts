import { extractor } from '../../src/insights/extractors/categoryOutlier';

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
    const result = extractor(data, ['type'], [{ field: 'sales', method: 'SUM' }]);
    const outlierIndexes = result?.map((item) => item.index);
    expect(outlierIndexes).toStrictEqual([3]);
  });
});
