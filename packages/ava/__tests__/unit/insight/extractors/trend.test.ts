import { extractor } from '../../../../src/insight/insights/extractors/trend';

const data = [
  { year: '1991', value: 3 },
  { year: '1992', value: 4 },
  { year: '1993', value: 3.5 },
  { year: '1994', value: 5 },
  { year: '1995', value: 4.9 },
  { year: '1996', value: 6 },
  { year: '1997', value: 7 },
  { year: '1998', value: 9 },
  { year: '1999', value: 13 },
];

describe('extract trend insight', () => {
  test('check trend result', () => {
    const result = extractor(data, ['year'], [{ fieldName: 'value', method: 'SUM' }]);
    expect(result[0]?.trend).toEqual('increasing');
  });
});
