import { insightPatternsExtractor } from '../../../../src/insight/insights';

const data = [
  { year: '1991', value: 0.3 },
  { year: '1992', value: -0.5 },
  { year: '1993', value: 0.05 },
  { year: '1994', value: -0.2 },
  { year: '1995', value: 0.4 },
  { year: '1996', value: 6 },
  { year: '1997', value: 3 },
  { year: '1998', value: 9 },
  { year: '1999', value: 5 },
];

describe('extract change-point insight', () => {
  test('check change-point result', () => {
    const result = insightPatternsExtractor({
      data,
      dimensions: [{ fieldName: 'year' }],
      measures: [{ fieldName: 'value', method: 'SUM' }],
      insightType: 'change_point',
      options: {
        filterInsight: true,
      },
    });
    expect(result[0]?.index).toEqual(5);
  });
});
