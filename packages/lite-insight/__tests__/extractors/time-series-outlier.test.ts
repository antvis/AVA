import { extractor } from '../../src/insights/extractors/timeSeriesOutlier';

const data = [
  { year: '1991', value: 3 },
  { year: '1992', value: 4 },
  { year: '1993', value: 3.5 },
  { year: '1994', value: 5 },
  { year: '1995', value: 4.9 },
  { year: '1996', value: 6 },
  { year: '1997', value: 7 },
  { year: '1998', value: 13 },
  { year: '1999', value: 4 },
];

describe('extract time-series-outlier insight', () => {
  test('check outliers result', () => {
    const result = extractor(data, ['year'], [{ field: 'value', method: 'SUM' }]);
    const outliers = result?.map((item) => item.index);
    expect(outliers).toStrictEqual([7]);
  });
});
