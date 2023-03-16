import DataFrame from '../../../../../../src/data/dataset/field/dataFrame';
import Series from '../../../../../../src/data/dataset/field/series';

describe('DataFrame getter', () => {
  test('shape', () => {
    const df = new DataFrame({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });

    expect(df.shape).toStrictEqual([3, 2]);
  });
});

describe('DataFrame get value functions', () => {
  const df = new DataFrame([
    { a: 1, b: 4, c: 7 },
    { a: 2, b: 5, c: 8 },
    { a: 3, b: 6, c: 9 },
  ]);

  test('get', () => {
    /* only rowLoc */
    // rowLoc is Axis
    const rowLocNum = df.get(0);
    expect(rowLocNum).toStrictEqual(
      new Series([1, 4, 7], {
        indexes: ['a', 'b', 'c'],
      })
    );

    // rowLoc is Axis[]
    const rowLocNumArr = df.get([0, 2]);
    // DataFrame contains private functions, we can't compare it by serializing to the same string
    expect(rowLocNumArr.data).toStrictEqual([
      [1, 4, 7],
      [3, 6, 9],
    ]);
    expect(rowLocNumArr.axes).toStrictEqual([
      [0, 2],
      ['a', 'b', 'c'],
    ]);

    // rowLoc is slice
    const rowLocStrSlice = df.get('0:2');
    expect(rowLocStrSlice.data).toStrictEqual([
      [1, 4, 7],
      [2, 5, 8],
    ]);
    expect(rowLocStrSlice.axes).toStrictEqual([
      [0, 1],
      ['a', 'b', 'c'],
    ]);

    /* rowLoc and colLoc */
    // rowLoc is axis, colLoc is axis
    const rowLocNumColLocNum = df.get(1, 'c');
    expect(rowLocNumColLocNum.data).toStrictEqual([[8]]);
    expect(rowLocNumColLocNum.axes).toStrictEqual([[1], ['c']]);

    // rowLoc is axis, colLoc is axis[]
    const rowLocNumColLocNumArr = df.get(1, ['a', 'c']);
    expect(rowLocNumColLocNumArr.data).toStrictEqual([[2, 8]]);
    expect(rowLocNumColLocNumArr.axes).toStrictEqual([[1], ['a', 'c']]);

    // rowLoc is axis, colLoc is slice
    const rowLocNumColLocSlice = df.get(1, 'a:c');
    expect(rowLocNumColLocSlice.data).toStrictEqual([[2, 5]]);
    expect(rowLocNumColLocSlice.axes).toStrictEqual([[1], ['a', 'b']]);

    // rowLoc is axis[], colLoc is axis
    const rowLocNumArrColLocNum = df.get([1, 2], 'a');
    expect(rowLocNumArrColLocNum.data).toStrictEqual([[2], [3]]);
    expect(rowLocNumArrColLocNum.axes).toStrictEqual([[1, 2], ['a']]);

    // rowLoc is axis[], colLoc is axis[]
    const rowLocNumArrColLocNumArr = df.get([1, 2], ['a', 'b']);
    expect(rowLocNumArrColLocNumArr.data).toStrictEqual([
      [2, 5],
      [3, 6],
    ]);
    expect(rowLocNumArrColLocNumArr.axes).toStrictEqual([
      [1, 2],
      ['a', 'b'],
    ]);

    // rowLoc is axis[], colLoc is slice
    const rowLocNumArrColLocSlice = df.get([1, 2], 'b:c');
    expect(rowLocNumArrColLocSlice.data).toStrictEqual([[5], [6]]);
    expect(rowLocNumArrColLocSlice.axes).toStrictEqual([[1, 2], ['b']]);

    // rowLoc is slice, colLoc is axis
    const rowLocSliceColLocNum = df.get('0:2', 'b');
    expect(rowLocSliceColLocNum.data).toStrictEqual([[4], [5]]);
    expect(rowLocSliceColLocNum.axes).toStrictEqual([[0, 1], ['b']]);

    // rowLoc is slice, colLoc is axis[]
    const rowLocSliceColLocNumArr = df.get('0:2', ['b', 'c']);
    expect(rowLocSliceColLocNumArr.data).toStrictEqual([
      [4, 7],
      [5, 8],
    ]);
    expect(rowLocSliceColLocNumArr.axes).toStrictEqual([
      [0, 1],
      ['b', 'c'],
    ]);

    // rowLoc is slice, colLoc is slice
    const rowLocSliceColLocSlice = df.get('0:2', 'b:c');
    expect(rowLocSliceColLocSlice.data).toStrictEqual([[4], [5]]);
    expect(rowLocSliceColLocSlice.axes).toStrictEqual([[0, 1], ['b']]);
  });

  test('getByIndex', () => {
    /* only rowLoc */
    // rowLoc is int
    const rowLocInt = df.getByIndex(0);
    expect(rowLocInt).toStrictEqual(
      new Series([1, 4, 7], {
        indexes: ['a', 'b', 'c'],
      })
    );

    // rowLoc is int[]
    const rowLocIntArr = df.getByIndex([0, 2]);
    // DataFrame contains private functions, we can't compare it by serializing to the same string
    expect(rowLocIntArr.data).toStrictEqual([
      [1, 4, 7],
      [3, 6, 9],
    ]);
    expect(rowLocIntArr.axes).toStrictEqual([
      [0, 2],
      ['a', 'b', 'c'],
    ]);

    // rowLoc is slice
    const rowLocStrSlice = df.getByIndex('0:2');
    expect(rowLocStrSlice.data).toStrictEqual([
      [1, 4, 7],
      [2, 5, 8],
    ]);
    expect(rowLocStrSlice.axes).toStrictEqual([
      [0, 1],
      ['a', 'b', 'c'],
    ]);

    /* rowLoc and colLoc */
    // rowLoc is int, colLoc is int
    const rowLocIntColLocInt = df.getByIndex(1, 2);
    expect(rowLocIntColLocInt.data).toStrictEqual([[8]]);
    expect(rowLocIntColLocInt.axes).toStrictEqual([[1], ['c']]);

    // rowLoc is int, colLoc is int[]
    const rowLocIntColLocIntArr = df.getByIndex(1, [0, 2]);
    expect(rowLocIntColLocIntArr.data).toStrictEqual([[2, 8]]);
    expect(rowLocIntColLocIntArr.axes).toStrictEqual([[1], ['a', 'c']]);

    // rowLoc is int, colLoc is slice
    const rowLocIntColLocSlice = df.getByIndex(1, '0:2');
    expect(rowLocIntColLocSlice.data).toStrictEqual([[2, 5]]);
    expect(rowLocIntColLocSlice.axes).toStrictEqual([[1], ['a', 'b']]);

    // rowLoc is int[], colLoc is int
    const rowLocIntArrColLocInt = df.getByIndex([1, 2], 0);
    expect(rowLocIntArrColLocInt.data).toStrictEqual([[2], [3]]);
    expect(rowLocIntArrColLocInt.axes).toStrictEqual([[1, 2], ['a']]);

    // rowLoc is int[], colLoc is int[]
    const rowLocIntArrColLocIntArr = df.getByIndex([1, 2], [0, 1]);
    expect(rowLocIntArrColLocIntArr.data).toStrictEqual([
      [2, 5],
      [3, 6],
    ]);
    expect(rowLocIntArrColLocIntArr.axes).toStrictEqual([
      [1, 2],
      ['a', 'b'],
    ]);

    // rowLoc is int[], colLoc is slice
    const rowLocIntArrColLocSlice = df.getByIndex([1, 2], '1:2');
    expect(rowLocIntArrColLocSlice.data).toStrictEqual([[5], [6]]);
    expect(rowLocIntArrColLocSlice.axes).toStrictEqual([[1, 2], ['b']]);

    // rowLoc is slice, colLoc is int
    const rowLocSliceColLocInt = df.getByIndex('0:2', 1);
    expect(rowLocSliceColLocInt.data).toStrictEqual([[4], [5]]);
    expect(rowLocSliceColLocInt.axes).toStrictEqual([[0, 1], ['b']]);

    // rowLoc is slice, colLoc is int[]
    const rowLocSliceColLocIntArr = df.getByIndex('0:2', [1, 2]);
    expect(rowLocSliceColLocIntArr.data).toStrictEqual([
      [4, 7],
      [5, 8],
    ]);
    expect(rowLocSliceColLocIntArr.axes).toStrictEqual([
      [0, 1],
      ['b', 'c'],
    ]);

    // rowLoc is slice, colLoc is slice
    const rowLocSliceColLocSlice = df.getByIndex('0:2', '1:2');
    expect(rowLocSliceColLocSlice.data).toStrictEqual([[4], [5]]);
    expect(rowLocSliceColLocSlice.axes).toStrictEqual([[0, 1], ['b']]);
  });

  test('getByColumn', () => {
    const getA = df.getByColumn('a');
    expect(getA).toStrictEqual(new Series([1, 2, 3], { indexes: [0, 1, 2] }));
  });
});
