import Series from '../../src/dataset/series';

describe('new Series', () => {
  test('1D: basic type', () => {
    const s = new Series(1);
    expect(s.data).toStrictEqual([1]);
    expect(s.axes).toStrictEqual([[0]]);
  });

  test('1D: basic type with extra index', () => {
    const s = new Series(1, { index: [0, 1, 2] });
    expect(s.data).toStrictEqual([1, 1, 1]);
    expect(s.axes).toStrictEqual([[0, 1, 2]]);
  });

  test('1D: object', () => {
    const s = new Series({ a: 1, b: 2, c: 3 });
    expect(s.data).toStrictEqual([1, 2, 3]);
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
  });

  test('1D: object with extra index', () => {
    const s = new Series({ a: 1, b: 2, c: 3 }, { index: ['c', 'a'] });
    expect(s.data).toStrictEqual([3, 1]);
    expect(s.axes).toStrictEqual([['c', 'a']]);
  });

  test('1D: array', () => {
    const s = new Series([1, 2, 3]);
    expect(s.data).toStrictEqual([1, 2, 3]);
    expect(s.axes).toStrictEqual([[0, 1, 2]]);
  });

  test('1D: array with extra index', () => {
    const s = new Series([1, 2, 3], { index: ['a', 'b', 'c'] });
    expect(s.data).toStrictEqual([1, 2, 3]);
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
  });
});

describe('Series getter', () => {
  test('shape', () => {
    const df = new Series({ a: 1, b: 2, c: 3 });

    expect(df.shape).toStrictEqual([3]);
  });
});

describe('Series get value functions', () => {
  const s = new Series({ a: 1, b: 2, c: 3 });

  test('get', () => {
    const s2 = new Series([1, 2, 3]);
    // number
    const rowLocNum = s2.get(0);
    expect(rowLocNum).toStrictEqual(1);

    const rowLocNumArr = s2.get([0, 2]);
    expect(rowLocNumArr).toStrictEqual(
      new Series([1, 3], {
        index: [0, 2],
      })
    );

    const numStrSlice = s2.get('0:2');
    expect(numStrSlice).toStrictEqual(
      new Series([1, 2], {
        index: [0, 1],
      })
    );

    // string
    const rowLocStr = s.get('a');
    expect(rowLocStr).toStrictEqual(1);

    const rowLocStrArr = s.getByIntegerIndex([0, 2]);
    expect(rowLocStrArr).toStrictEqual(
      new Series([1, 3], {
        index: ['a', 'c'],
      })
    );

    const rowLocStrSlice = s.get('a:c');
    expect(rowLocStrSlice).toStrictEqual(
      new Series([1, 2], {
        index: ['a', 'b'],
      })
    );
  });

  test('getByIntegerIndex', () => {
    const rowLocInt = s.getByIntegerIndex(0);
    expect(rowLocInt).toStrictEqual(1);

    const rowLocIntArr = s.getByIntegerIndex([0, 2]);
    expect(rowLocIntArr).toStrictEqual(
      new Series([1, 3], {
        index: ['a', 'c'],
      })
    );

    const rowLocStrSlice = s.getByIntegerIndex('0:2');
    expect(rowLocStrSlice).toStrictEqual(
      new Series([1, 2], {
        index: ['a', 'b'],
      })
    );
  });
});
