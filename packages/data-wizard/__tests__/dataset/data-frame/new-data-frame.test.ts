import DataFrame from '../../../src/dataset/data-frame';

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
      'When the length of extra.columns is larger than 1, extra.indexes is required.'
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
