import Series from '../../../../../../src/data/dataset/field/series';

describe('Series data with fillValue', () => {
  test('1D: basic type', () => {
    const s = new Series(undefined, { fillValue: 201 });
    expect(s.data).toStrictEqual([201]);
  });

  test('1D: basic type with extra indexes', () => {
    const s = new Series(null, { indexes: [0, 1, 2], fillValue: 201 });
    expect(s.data).toStrictEqual([201, 201, 201]);
  });

  test('1D: object', () => {
    const s = new Series({ a: 1, b: null, c: 3 }, { fillValue: 201 });
    expect(s.data).toStrictEqual([1, 201, 3]);
  });

  test('1D: object with extra indexes', () => {
    const s = new Series({ a: 1, b: 2, c: '' }, { indexes: ['c', 'a'], fillValue: 201 });
    expect(s.data).toStrictEqual([201, 1]);
  });

  test('1D: array', () => {
    const s = new Series(['', 2, ''], { fillValue: 201 });
    expect(s.data).toStrictEqual([201, 2, 201]);
  });

  test('1D: array with extra indexes', () => {
    const s = new Series([undefined, 2, 3], { indexes: ['a', 'b', 'c'], fillValue: 201 });
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
    expect(s.data).toStrictEqual([201, 2, 3]);
  });
});
