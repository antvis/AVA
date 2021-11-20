import Series from '../../src/dataset/series';

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
        indexes: [0, 2],
      })
    );

    const numStrSlice = s2.get('0:2');
    expect(numStrSlice).toStrictEqual(
      new Series([1, 2], {
        indexes: [0, 1],
      })
    );

    // string
    const rowLocStr = s.get('a');
    expect(rowLocStr).toStrictEqual(1);

    const rowLocStrArr = s.getByIndex([0, 2]);
    expect(rowLocStrArr).toStrictEqual(
      new Series([1, 3], {
        indexes: ['a', 'c'],
      })
    );

    const rowLocStrSlice = s.get('a:c');
    expect(rowLocStrSlice).toStrictEqual(
      new Series([1, 2], {
        indexes: ['a', 'b'],
      })
    );
  });

  test('getByIndex', () => {
    const rowLocInt = s.getByIndex(0);
    expect(rowLocInt).toStrictEqual(1);

    const rowLocIntArr = s.getByIndex([0, 2]);
    expect(rowLocIntArr).toStrictEqual(
      new Series([1, 3], {
        indexes: ['a', 'c'],
      })
    );

    const rowLocStrSlice = s.getByIndex('0:2');
    expect(rowLocStrSlice).toStrictEqual(
      new Series([1, 2], {
        indexes: ['a', 'b'],
      })
    );
  });
});

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
