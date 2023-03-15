import Series from '../../../../../../src/data/dataset/field/series';

describe('Series data with columnTypes', () => {
  test('1D: basic type', () => {
    const s = new Series(201, { columnTypes: ['string'] });
    expect(s.data).toStrictEqual(['201']);
  });

  test('1D: basic type with extra indexes', () => {
    const s = new Series(201, { indexes: [0, 1, 2], columnTypes: ['string'] });
    expect(s.data).toStrictEqual(['201', '201', '201']);
  });

  test('1D: object', () => {
    const s = new Series({ a: 1, b: 201, c: 3 }, { columnTypes: ['string'] });
    expect(s.data).toStrictEqual(['1', '201', '3']);
  });

  test('1D: object with extra indexes', () => {
    const s = new Series({ a: 1, b: 2, c: '201' }, { indexes: ['c', 'a'], columnTypes: ['string'] });
    expect(s.data).toStrictEqual(['201', '1']);
  });

  test('1D: array', () => {
    const s = new Series([201, 2, '201'], { columnTypes: ['string'] });
    expect(s.data).toStrictEqual(['201', '2', '201']);
  });

  test('1D: array with extra indexes', () => {
    const s = new Series([201, 2, 3], { indexes: ['a', 'b', 'c'], columnTypes: ['string'] });
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
    expect(s.data).toStrictEqual(['201', '2', '3']);
  });
});
