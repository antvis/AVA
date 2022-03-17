import Series from '../../../src/dataset/series';

describe('new Series', () => {
  test('1D: basic type', () => {
    const s = new Series(1);
    expect(s.data).toStrictEqual([1]);
    expect(s.axes).toStrictEqual([[0]]);
  });

  test('1D: basic type with extra indexes', () => {
    const s = new Series(1, { indexes: [0, 1, 2] });
    expect(s.axes).toStrictEqual([[0, 1, 2]]);
    expect(s.data).toStrictEqual([1, 1, 1]);
  });

  test('1D: object', () => {
    const s = new Series({ a: 1, b: 2, c: 3 });
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
    expect(s.data).toStrictEqual([1, 2, 3]);
  });

  test('1D: object with extra indexes', () => {
    const s = new Series({ a: 1, b: 2, c: 3 }, { indexes: ['c', 'a'] });
    expect(s.axes).toStrictEqual([['c', 'a']]);
    expect(s.data).toStrictEqual([3, 1]);
  });

  test('1D: array', () => {
    const s = new Series([1, 2, 3]);
    expect(s.axes).toStrictEqual([[0, 1, 2]]);
    expect(s.data).toStrictEqual([1, 2, 3]);
  });

  test('1D: array with extra indexes', () => {
    const s = new Series([1, 2, 3], { indexes: ['a', 'b', 'c'] });
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
    expect(s.data).toStrictEqual([1, 2, 3]);
  });
});
