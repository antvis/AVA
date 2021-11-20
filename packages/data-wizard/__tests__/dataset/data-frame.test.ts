import DataFrame from '../../src/dataset/data-frame';
import Series from '../../src/dataset/series';
import * as analyzer from '../../src/analyzer';

describe('new DataFrame', () => {
  test('1D: basic type', () => {
    const df = new DataFrame(1);
    expect(df.axes).toStrictEqual([[0], [0]]);
    expect(df.data).toStrictEqual([[1]]);
    expect(df.colData).toStrictEqual([[1]]);
  });

  test('1D: basic type with extra indexes and columns', () => {
    const df = new DataFrame(1, { indexes: ['kk', 'bb'], columns: [5, 6] });
    expect(df.axes).toStrictEqual([
      ['kk', 'bb'],
      [5, 6],
    ]);
    expect(df.data).toStrictEqual([
      [1, 1],
      [1, 1],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 1],
      [1, 1],
    ]);
  });

  test('1D: basic type with error extra', () => {
    expect(() => new DataFrame(1, { columns: [5, 6] })).toThrow(
      'When the length of extra?.columns is larger than 1, extra?.indexes is required.'
    );
  });

  test('1D: array', () => {
    const df = new DataFrame([1, 2, 3]);
    expect(df.axes).toStrictEqual([[0, 1, 2], [0]]);
    expect(df.data).toStrictEqual([[1], [2], [3]]);
    expect(df.colData).toStrictEqual([[1, 2, 3]]);
  });

  test('1D: array with extra indexes and columns', () => {
    const df = new DataFrame([1, 2, 3], { indexes: ['b', 'c', 'a'], columns: ['col'] });
    expect(df.axes).toStrictEqual([['b', 'c', 'a'], ['col']]);
    expect(df.data).toStrictEqual([[1], [2], [3]]);
    expect(df.colData).toStrictEqual([[1, 2, 3]]);
  });

  test('1D: object', () => {
    const df = new DataFrame({ a: 1, b: 2, c: 3 });
    expect(df.axes).toStrictEqual([[0], ['a', 'b', 'c']]);
    expect(df.data).toStrictEqual([[1, 2, 3]]);
    expect(df.colData).toStrictEqual([[1], [2], [3]]);
  });

  test('1D: object with extra indexes and columns', () => {
    const df = new DataFrame({ a: 1, b: 2, c: 3 }, { indexes: ['idx1'], columns: ['c', 'b'] });
    expect(df.axes).toStrictEqual([['idx1'], ['c', 'b']]);
    expect(df.data).toStrictEqual([[3, 2]]);
    expect(df.colData).toStrictEqual([[3], [2]]);
  });

  test('2D: array', () => {
    const df = new DataFrame([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(df.axes).toStrictEqual([
      [0, 1, 2],
      [0, 1],
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
  });

  test('2D: array with extra indexes and columns', () => {
    const df = new DataFrame(
      [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
      {
        indexes: ['a', 'b', 'c'],
        columns: ['col1', 'col2'],
      }
    );
    expect(df.axes).toStrictEqual([
      ['a', 'b', 'c'],
      ['col1', 'col2'],
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
  });

  test('2D: object array', () => {
    const df = new DataFrame([
      { a: 1, b: 4 },
      { a: 2, b: 5 },
      { a: 3, b: 6 },
    ]);
    expect(df.axes).toStrictEqual([
      [0, 1, 2],
      ['a', 'b'],
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
  });

  test('2D: object array with extra indexes and columns', () => {
    const df = new DataFrame(
      [
        { a: 1, b: 4, c: 7 },
        { a: 2, b: 5, c: 8 },
        { a: 3, b: 6, c: 9 },
      ],
      { indexes: ['k', 'm', 'n'], columns: ['c', 'a'] }
    );
    expect(df.axes).toStrictEqual([
      ['k', 'm', 'n'],
      ['c', 'a'],
    ]);
    expect(df.data).toStrictEqual([
      [7, 1],
      [8, 2],
      [9, 3],
    ]);
    expect(df.colData).toStrictEqual([
      [7, 8, 9],
      [1, 2, 3],
    ]);
  });

  test('2D: array object', () => {
    const df = new DataFrame({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });
    expect(df.axes).toStrictEqual([
      [0, 1, 2],
      ['a', 'b'],
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
  });

  test('2D: array object with extra indexes and columns', () => {
    const df = new DataFrame(
      {
        a: [1, 2, 3],
        b: [4, 5, 6],
      },
      {
        indexes: ['p', 'q', 'r'],
        columns: ['b', 'a'],
      }
    );
    expect(df.axes).toStrictEqual([
      ['p', 'q', 'r'],
      ['b', 'a'],
    ]);
    expect(df.data).toStrictEqual([
      [4, 1],
      [5, 2],
      [6, 3],
    ]);
    expect(df.colData).toStrictEqual([
      [4, 5, 6],
      [1, 2, 3],
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

  test('getByIndex', () => {
    /** only rowLoc */
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

    /** rowLoc and colLoc */
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

describe('DataFrame info', () => {
  test('1D: basic type', () => {
    const df = new DataFrame(1);
    const info = df.info();
    expect(info).toStrictEqual([
      {
        count: 1,
        distinct: 1,
        type: 'integer',
        recommendation: 'integer',
        missing: 0,
        rawData: [1],
        valueMap: { '1': 1 },
        minimum: 1,
        maximum: 1,
        mean: 1,
        percentile5: 1,
        percentile25: 1,
        percentile50: 1,
        percentile75: 1,
        percentile95: 1,
        sum: 1,
        variance: 0,
        standardDeviation: 0,
        zeros: 0,
        levelOfMeasurements: ['Interval', 'Discrete'],
        name: '0',
      },
    ]);
  });

  test('1D: array', () => {
    const df = new DataFrame([1, 2, 3]);
    const info = df.info();
    expect(info).toStrictEqual([
      {
        count: 3,
        distinct: 3,
        type: 'integer',
        recommendation: 'integer',
        missing: 0,
        rawData: [1, 2, 3],
        valueMap: { '1': 1, '2': 1, '3': 1 },
        minimum: 1,
        maximum: 3,
        mean: 2,
        percentile5: 1,
        percentile25: 1,
        percentile50: 2,
        percentile75: 3,
        percentile95: 3,
        sum: 6,
        variance: 0.6666666666666666,
        standardDeviation: 0.816496580927726,
        zeros: 0,
        levelOfMeasurements: ['Interval', 'Discrete'],
        name: '0',
      },
    ]);
  });

  test('1D: object', () => {
    const df = new DataFrame({ a: 1, b: 2, c: 3 });
    const infos = df.info();
    expect(infos[0]).toStrictEqual({
      count: 1,
      distinct: 1,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1],
      valueMap: { '1': 1 },
      minimum: 1,
      maximum: 1,
      mean: 1,
      percentile5: 1,
      percentile25: 1,
      percentile50: 1,
      percentile75: 1,
      percentile95: 1,
      sum: 1,
      variance: 0,
      standardDeviation: 0,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'a',
    });
  });

  test('2D: array', () => {
    const df = new DataFrame([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    const infos = df.info();
    expect(infos[0]).toStrictEqual({
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1, 2, 3],
      valueMap: { '1': 1, '2': 1, '3': 1 },
      minimum: 1,
      maximum: 3,
      mean: 2,
      percentile5: 1,
      percentile25: 1,
      percentile50: 2,
      percentile75: 3,
      percentile95: 3,
      sum: 6,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: '0',
    });
  });

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
    expect(info.rawData).toStrictEqual([1, 2, 3]);
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

  test('2D: array object', () => {
    const df = new DataFrame({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });
    const infos = df.info();
    expect(infos[0]).toStrictEqual({
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1, 2, 3],
      valueMap: { '1': 1, '2': 1, '3': 1 },
      minimum: 1,
      maximum: 3,
      mean: 2,
      percentile5: 1,
      percentile25: 1,
      percentile50: 2,
      percentile75: 3,
      percentile95: 3,
      sum: 6,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'a',
    });
  });
});

describe('DataFrame data with fillValue', () => {
  test('1D: basic type', () => {
    const df = new DataFrame(undefined, { fillValue: 201 });
    expect(df.data).toStrictEqual([[201]]);
    expect(df.colData).toStrictEqual([[201]]);
  });

  test('1D: basic type with extra indexes and columns', () => {
    const df = new DataFrame(null, { indexes: ['kk', 'bb'], columns: [5, 6], fillValue: 201 });
    expect(df.data).toStrictEqual([
      [201, 201],
      [201, 201],
    ]);
    expect(df.colData).toStrictEqual([
      [201, 201],
      [201, 201],
    ]);
  });

  test('1D: array', () => {
    const df = new DataFrame([null, '', 3], { fillValue: 201 });
    expect(df.data).toStrictEqual([[201], [201], [3]]);
    expect(df.colData).toStrictEqual([[201, 201, 3]]);
  });

  test('1D: array with extra indexes and columns', () => {
    const df = new DataFrame([1, 2, undefined], { indexes: ['b', 'c', 'a'], columns: ['col'], fillValue: 201 });
    expect(df.data).toStrictEqual([[1], [2], [201]]);
    expect(df.colData).toStrictEqual([[1, 2, 201]]);
  });

  test('1D: object', () => {
    const df = new DataFrame({ a: 1, b: undefined, c: 3 }, { fillValue: 201 });
    expect(df.data).toStrictEqual([[1, 201, 3]]);
    expect(df.colData).toStrictEqual([[1], [201], [3]]);
  });

  test('1D: object with extra indexes and columns', () => {
    const df = new DataFrame({ a: 1, b: 2, c: null }, { indexes: ['idx1'], columns: ['c', 'b'], fillValue: 201 });
    expect(df.data).toStrictEqual([[201, 2]]);
    expect(df.colData).toStrictEqual([[201], [2]]);
  });

  test('2D: array', () => {
    const df = new DataFrame(
      [
        [1, 4],
        [2, undefined],
        [3, 6],
      ],
      { fillValue: 201 }
    );
    expect(df.data).toStrictEqual([
      [1, 4],
      [2, 201],
      [3, 6],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 2, 3],
      [4, 201, 6],
    ]);
  });

  test('2D: array with extra indexes and columns', () => {
    const df = new DataFrame(
      [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
      {
        indexes: ['a', 'b', 'c'],
        columns: ['col1', 'col2'],
      }
    );
    expect(df.axes).toStrictEqual([
      ['a', 'b', 'c'],
      ['col1', 'col2'],
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
  });

  test('2D: object array', () => {
    const df = new DataFrame([
      { a: '1', b: '2', c: '3' },
      { a: '1', b: '2', d: '4' },
      { e: '1', f: '2' },
    ]);
    expect(df.data).toStrictEqual([
      ['1', '2', '3', undefined, undefined, undefined],
      ['1', '2', undefined, '4', undefined, undefined],
      [undefined, undefined, undefined, undefined, '1', '2'],
    ]);
    expect(df.colData).toStrictEqual([
      ['1', '1', undefined],
      ['2', '2', undefined],
      ['3', undefined, undefined],
      [undefined, '4', undefined],
      [undefined, undefined, '1'],
      [undefined, undefined, '2'],
    ]);

    const df2 = new DataFrame(
      [
        { a: '1', b: '2', c: '3' },
        { a: '1', b: '2', d: '4' },
        { e: '1', f: '2' },
      ],
      {
        fillValue: 201,
      }
    );
    expect(df2.data).toStrictEqual([
      ['1', '2', '3', 201, 201, 201],
      ['1', '2', 201, '4', 201, 201],
      [201, 201, 201, 201, '1', '2'],
    ]);
    expect(df2.colData).toStrictEqual([
      ['1', '1', 201],
      ['2', '2', 201],
      ['3', 201, 201],
      [201, '4', 201],
      [201, 201, '1'],
      [201, 201, '2'],
    ]);

    const df3 = new DataFrame(
      [
        { a: null, b: '2', c: '3' },
        { a: '1', b: '2', d: undefined },
        { e: '', f: '2' },
      ],
      {
        fillValue: 201,
      }
    );
    expect(df3.data).toStrictEqual([
      [201, '2', '3', 201, 201, 201],
      ['1', '2', 201, 201, 201, 201],
      [201, 201, 201, 201, 201, '2'],
    ]);
    expect(df3.colData).toStrictEqual([
      [201, '1', 201],
      ['2', '2', 201],
      ['3', 201, 201],
      [201, 201, 201],
      [201, 201, 201],
      [201, 201, '2'],
    ]);
  });

  test('2D: object array with extra indexes and columns', () => {
    const df = new DataFrame(
      [
        { a: 1, b: 4, c: 7 },
        { a: 2, b: 5, c: null },
        { a: 3, b: undefined, c: 9 },
      ],
      { indexes: ['k', 'm', 'n'], columns: ['c', 'a'], fillValue: 201 }
    );
    expect(df.data).toStrictEqual([
      [7, 1],
      [201, 2],
      [9, 3],
    ]);
    expect(df.colData).toStrictEqual([
      [7, 201, 9],
      [1, 2, 3],
    ]);
  });

  test('2D: array object', () => {
    const df = new DataFrame(
      {
        a: [1, 2, null],
        b: [4, undefined, 6],
      },
      { fillValue: 201 }
    );
    expect(df.data).toStrictEqual([
      [1, 4],
      [2, 201],
      [201, 6],
    ]);
    expect(df.colData).toStrictEqual([
      [1, 2, 201],
      [4, 201, 6],
    ]);
  });

  test('2D: array object with extra indexes and columns', () => {
    const df = new DataFrame(
      {
        a: [1, 2, ''],
        b: ['', 5, 6],
      },
      {
        indexes: ['p', 'q', 'r'],
        columns: ['b', 'a'],
        fillValue: 201,
      }
    );
    expect(df.data).toStrictEqual([
      [201, 1],
      [5, 2],
      [6, 201],
    ]);
    expect(df.colData).toStrictEqual([
      [201, 5, 6],
      [1, 2, 201],
    ]);
  });

  test('2D: array object (graph data)', () => {
    const df = new DataFrame({
      nodes: [
        { id: '1', label: 'Company1' },
        { id: '2', label: 'Company2' },
        { id: '3', label: 'Company3' },
        { id: '4', label: 'Company4' },
        { id: '5', label: 'Company5' },
        { id: '6', label: 'Company6' },
        { id: '7', label: 'Company7' },
        { id: '8', label: 'Company8' },
        { id: '9', label: 'Company9' },
      ],
      edges: [
        { source: '1', target: '2', data: { type: 'A', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '1', target: '3', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '2', target: '5', data: { type: 'C', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '5', target: '6', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '3', target: '4', data: { type: 'C', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '4', target: '7', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '1', target: '8', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '1', target: '9', data: { type: 'C', amount: '100,000 Yuan', date: '2019-08-03' } },
      ],
    });

    expect(df.getByColumn('edges').data[8]).toBeUndefined();
  });

  const df2 = new DataFrame(
    {
      nodes: [
        { id: '1', label: 'Company1' },
        { id: '2', label: 'Company2' },
        { id: '3', label: 'Company3' },
        { id: '4', label: 'Company4' },
        { id: '5', label: 'Company5' },
        { id: '6', label: 'Company6' },
        { id: '7', label: 'Company7' },
        { id: '8', label: 'Company8' },
        { id: '9', label: 'Company9' },
      ],
      edges: [
        { source: '1', target: '2', data: { type: 'A', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '1', target: '3', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '2', target: '5', data: { type: 'C', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '5', target: '6', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '3', target: '4', data: { type: 'C', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '4', target: '7', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '1', target: '8', data: { type: 'B', amount: '100,000 Yuan', date: '2019-08-03' } },
        { source: '1', target: '9', data: { type: 'C', amount: '100,000 Yuan', date: '2019-08-03' } },
      ],
    },
    {
      fillValue: { source: '1', target: '9', data: { type: 'FILL', amount: '100,000 Yuan', date: '2021-08-03' } },
    }
  );
  expect(df2.getByColumn('edges').data[8]).toStrictEqual({
    source: '1',
    target: '9',
    data: { type: 'FILL', amount: '100,000 Yuan', date: '2021-08-03' },
  });
});
