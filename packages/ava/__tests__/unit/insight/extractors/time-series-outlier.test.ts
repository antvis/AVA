import { insightPatternsExtractor } from '../../../../src/insight/insights';

const data = [
  { year: '1991', value: 3 },
  { year: '1992', value: 4 },
  { year: '1993', value: 3.5 },
  { year: '1994', value: 5 },
  { year: '1995', value: 4.9 },
  { year: '1996', value: 6 },
  { year: '1997', value: 7 },
  { year: '1998', value: 13 },
  { year: '1999', value: 9 },
];

describe('extract time-series-outlier insight', () => {
  test('check outliers result', () => {
    const result = insightPatternsExtractor({
      data,
      dimensions: [{ fieldName: 'year' }],
      measures: [{ fieldName: 'value', method: 'SUM' }],
      insightType: 'time_series_outlier',
      options: {
        filterInsight: true,
      },
    });
    const outliers = result?.map((item) => item.index);
    expect(outliers).toStrictEqual([7]);
  });
});
