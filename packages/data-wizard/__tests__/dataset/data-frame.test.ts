import DataFrame from '../../src/dataset/data-frame';
import Series from '../../src/dataset/series';
import * as analyzer from '../../src/analyzer';

describe('new DataFrame', () => {
  test('1D: basic type', () => {
    const df = new DataFrame(1);
    expect(df.data).toStrictEqual([1]);
    expect(df.colData).toStrictEqual([1]);
    expect(df.axes).toStrictEqual([[0], [0]]);
  });

  test('1D: basic type with extra index and columns', () => {
    const df = new DataFrame(1, { index: ['kk', 'bb'], columns: [5, 6] });
    expect(df.data).toStrictEqual([
      [1, 1],
      [1, 1],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 1],
      [1, 1],
    ]);
    expect(df.axes).toStrictEqual([
      ['kk', 'bb'],
      [5, 6],
    ]);
  });

  test('1D: basic type with error extra', () => {
    expect(() => new DataFrame(1, { columns: [5, 6] })).toThrow('When the length of extra?.columns is larger than 1, extra?.index is required.');
  });

  test('1D: array', () => {
    const df = new DataFrame([1, 2, 3]);
    expect(df.data).toStrictEqual([1, 2, 3]);
    expect(df.colData).toStrictEqual([1, 2, 3]);
    expect(df.axes).toStrictEqual([[0, 1, 2], [0]]);
  });

  test('1D: array with extra index and columns', () => {
    const df = new DataFrame([1, 2, 3], { index: ['b', 'c', 'a'], columns: ['col'] });
    expect(df.data).toStrictEqual([1, 2, 3]);
    expect(df.colData).toStrictEqual([1, 2, 3]);
    expect(df.axes).toStrictEqual([['b', 'c', 'a'], ['col']]);
  });

  test('1D: object', () => {
    const df = new DataFrame({ a: 1, b: 2, c: 3 });
    expect(df.data).toStrictEqual([1, 2, 3]);
    expect(df.colData).toStrictEqual([1, 2, 3]);
    expect(df.axes).toStrictEqual([[0], ['a', 'b', 'c']]);
  });

  test('1D: object with extra index and columns', () => {
    const df = new DataFrame({ a: 1, b: 2, c: 3 }, { index: ['idx1'], columns: ['c', 'b'] });
    expect(df.data).toStrictEqual([3, 2]);
    expect(df.colData).toStrictEqual([3, 2]);
    expect(df.axes).toStrictEqual([['idx1'], ['c', 'b']]);
  });

  test('2D: array', () => {
    const df = new DataFrame([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(df.data).toStrictEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(df.axes).toStrictEqual([
      [0, 1, 2],
      [0, 1],
    ]);
  });

  test('2D: array with extra index and columns', () => {
    const df = new DataFrame(
      [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
      {
        index: ['a', 'b', 'c'],
        columns: ['col1', 'col2'],
      }
    );
    expect(df.data).toStrictEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(df.axes).toStrictEqual([
      ['a', 'b', 'c'],
      ['col1', 'col2'],
    ]);
  });

  test('2D: object array', () => {
    const df = new DataFrame([
      { a: 1, b: 4 },
      { a: 2, b: 5 },
      { a: 3, b: 6 },
    ]);
    expect(df.data).toStrictEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(df.axes).toStrictEqual([
      [0, 1, 2],
      ['a', 'b'],
    ]);
  });

  test('2D: object array with extra index and columns', () => {
    const df = new DataFrame(
      [
        { a: 1, b: 4, c: 7 },
        { a: 2, b: 5, c: 8 },
        { a: 3, b: 6, c: 9 },
      ],
      { index: ['k', 'm', 'n'], columns: ['c', 'a'] }
    );

    expect(df.data).toStrictEqual([
      [7, 1],
      [8, 2],
      [9, 3],
    ]);
    expect(df.colData).toStrictEqual([
      [7, 8, 9],
      [1, 2, 3],
    ]);
    expect(df.axes).toStrictEqual([
      ['k', 'm', 'n'],
      ['c', 'a'],
    ]);
  });

  test('2D: array object', () => {
    const df = new DataFrame({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });
    expect(df.data).toStrictEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(df.axes).toStrictEqual([
      [0, 1, 2],
      ['a', 'b'],
    ]);
  });

  test('2D: array object with extra index and columns', () => {
    const df = new DataFrame(
      {
        a: [1, 2, 3],
        b: [4, 5, 6],
      },
      {
        index: ['p', 'q', 'r'],
        columns: ['b', 'a'],
      }
    );
    expect(df.data).toStrictEqual([
      [4, 1],
      [5, 2],
      [6, 3],
    ]);
    expect(df.colData).toStrictEqual([
      [4, 5, 6],
      [1, 2, 3],
    ]);
    expect(df.axes).toStrictEqual([
      ['p', 'q', 'r'],
      ['b', 'a'],
    ]);
  });
});

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
    /** only rowLoc */
    // rowLoc is Axis
    const rowLocNum = df.get(0);
    expect(rowLocNum).toStrictEqual(
      new Series([1, 4, 7], {
        index: ['a', 'b', 'c'],
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

    /** rowLoc and colLoc */
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

  test('getByIntegerIndex', () => {
    /** only rowLoc */
    // rowLoc is int
    const rowLocInt = df.getByIntegerIndex(0);
    expect(rowLocInt).toStrictEqual(
      new Series([1, 4, 7], {
        index: ['a', 'b', 'c'],
      })
    );

    // rowLoc is int[]
    const rowLocIntArr = df.getByIntegerIndex([0, 2]);
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
    const rowLocStrSlice = df.getByIntegerIndex('0:2');
    expect(rowLocStrSlice.data).toStrictEqual([
      [1, 4, 7],
      [2, 5, 8],
    ]);
    expect(rowLocStrSlice.axes).toStrictEqual([
      [0, 1],
      ['a', 'b', 'c'],
    ]);

    /** rowLoc and colLoc */
    // rowLoc is int, colLoc is int
    const rowLocIntColLocInt = df.getByIntegerIndex(1, 2);
    expect(rowLocIntColLocInt.data).toStrictEqual([[8]]);
    expect(rowLocIntColLocInt.axes).toStrictEqual([[1], ['c']]);

    // rowLoc is int, colLoc is int[]
    const rowLocIntColLocIntArr = df.getByIntegerIndex(1, [0, 2]);
    expect(rowLocIntColLocIntArr.data).toStrictEqual([[2, 8]]);
    expect(rowLocIntColLocIntArr.axes).toStrictEqual([[1], ['a', 'c']]);

    // rowLoc is int, colLoc is slice
    const rowLocIntColLocSlice = df.getByIntegerIndex(1, '0:2');
    expect(rowLocIntColLocSlice.data).toStrictEqual([[2, 5]]);
    expect(rowLocIntColLocSlice.axes).toStrictEqual([[1], ['a', 'b']]);

    // rowLoc is int[], colLoc is int
    const rowLocIntArrColLocInt = df.getByIntegerIndex([1, 2], 0);
    expect(rowLocIntArrColLocInt.data).toStrictEqual([[2], [3]]);
    expect(rowLocIntArrColLocInt.axes).toStrictEqual([[1, 2], ['a']]);

    // rowLoc is int[], colLoc is int[]
    const rowLocIntArrColLocIntArr = df.getByIntegerIndex([1, 2], [0, 1]);
    expect(rowLocIntArrColLocIntArr.data).toStrictEqual([
      [2, 5],
      [3, 6],
    ]);
    expect(rowLocIntArrColLocIntArr.axes).toStrictEqual([
      [1, 2],
      ['a', 'b'],
    ]);

    // rowLoc is int[], colLoc is slice
    const rowLocIntArrColLocSlice = df.getByIntegerIndex([1, 2], '1:2');
    expect(rowLocIntArrColLocSlice.data).toStrictEqual([[5], [6]]);
    expect(rowLocIntArrColLocSlice.axes).toStrictEqual([[1, 2], ['b']]);

    // rowLoc is slice, colLoc is int
    const rowLocSliceColLocInt = df.getByIntegerIndex('0:2', 1);
    expect(rowLocSliceColLocInt.data).toStrictEqual([[4], [5]]);
    expect(rowLocSliceColLocInt.axes).toStrictEqual([[0, 1], ['b']]);

    // rowLoc is slice, colLoc is int[]
    const rowLocSliceColLocIntArr = df.getByIntegerIndex('0:2', [1, 2]);
    expect(rowLocSliceColLocIntArr.data).toStrictEqual([
      [4, 7],
      [5, 8],
    ]);
    expect(rowLocSliceColLocIntArr.axes).toStrictEqual([
      [0, 1],
      ['b', 'c'],
    ]);

    // rowLoc is slice, colLoc is slice
    const rowLocSliceColLocSlice = df.getByIntegerIndex('0:2', '1:2');
    expect(rowLocSliceColLocSlice.data).toStrictEqual([[4], [5]]);
    expect(rowLocSliceColLocSlice.axes).toStrictEqual([[0, 1], ['b']]);
  });

  test('getByColumn', () => {
    const getA = df.getByColumn('a');
    expect(getA).toStrictEqual(new Series([1, 2, 3], { index: [0, 1, 2] }));
  });
});

describe('DataFrame info', () => {
  test('2D: object array', () => {
    const df = new DataFrame(
      [
        { a: 1, b: 4, c: 7 },
        { a: 2, b: 5, c: 8 },
        { a: 3, b: 6, c: 9 },
      ],
      { columns: ['a', 'c'] }
    );

    const infos = df.info();
    const info = infos[0] as analyzer.NumberFieldInfo & { name: String };

    expect(info.count).toBe(3);
    expect(info.distinct).toBe(3);
    expect(info.type).toBe('integer');
    expect(info.recommendation).toBe('integer');
    expect(info.missing).toBe(0);
    expect(info.samples).toStrictEqual([1, 2, 3]);
    expect(info.valueMap).toStrictEqual({ '1': 1, '2': 1, '3': 1 });
    expect(info.minimum).toBe(1);
    expect(info.maximum).toBe(3);
    expect(info.mean).toBe(2);
    expect(info.percentile5).toBe(1);
    expect(info.percentile25).toBe(1);
    expect(info.percentile50).toBe(2);
    expect(info.percentile75).toBe(3);
    expect(info.percentile95).toBe(3);
    expect(info.sum).toBe(6);
    expect(info.variance).toBe(0.6666666666666666);
    expect(info.standardDeviation).toBe(0.816496580927726);
    expect(info.zeros).toBe(0);
    expect(info.levelOfMeasurements).toStrictEqual(['Interval', 'Discrete']);
    expect(info.name).toBe('a');
  });
});
