import Series from '../../../src/dataset/series';

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
