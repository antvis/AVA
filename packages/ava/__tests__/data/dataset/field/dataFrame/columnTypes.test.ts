import DataFrame from '../../../../../src/data/dataset/field/dataFrame';

describe('DataFrame data with columnTypes', () => {
  test('1D: basic type', () => {
    const df = new DataFrame(201, { columnTypes: ['string'] });
    expect(df.data).toStrictEqual([['201']]);
    expect(df.colData).toStrictEqual([['201']]);
  });

  test('1D: basic type with extra indexes and columns', () => {
    const df = new DataFrame(201, { indexes: ['kk', 'bb'], columns: [5, 6], columnTypes: ['string', 'integer'] });
    expect(df.data).toStrictEqual([
      ['201', 201],
      ['201', 201],
    ]);
    expect(df.colData).toStrictEqual([
      ['201', 201],
      ['201', 201],
    ]);
  });

  test('1D: array', () => {
    const df = new DataFrame([201, '201', 3], { columnTypes: ['string'] });
    expect(df.data).toStrictEqual([['201'], ['201'], ['3']]);
    expect(df.colData).toStrictEqual([['201', '201', '3']]);
  });

  test('1D: array with extra indexes and columns', () => {
    const df = new DataFrame([1, 2, 201], { indexes: ['b', 'c', 'a'], columns: ['col'], columnTypes: ['string'] });
    expect(df.data).toStrictEqual([['1'], ['2'], ['201']]);
    expect(df.colData).toStrictEqual([['1', '2', '201']]);
  });

  test('1D: object', () => {
    const df = new DataFrame({ a: 1, b: '201', c: 3 }, { columnTypes: ['string', 'string', 'string'] });
    expect(df.data).toStrictEqual([['1', '201', '3']]);
    expect(df.colData).toStrictEqual([['1'], ['201'], ['3']]);
  });

  test('1D: object with extra indexes and columns', () => {
    const df = new DataFrame(
      { a: 1, b: 2, c: 201 },
      { indexes: ['idx1'], columns: ['c', 'b'], columnTypes: ['', 'string'] }
    );
    expect(df.data).toStrictEqual([[201, '2']]);
    expect(df.colData).toStrictEqual([[201], ['2']]);
  });

  test('2D: array', () => {
    const df = new DataFrame(
      [
        [1, 4],
        [2, '201'],
        [3, 6],
      ],
      { columnTypes: ['string', 'integer'] }
    );
    expect(df.data).toStrictEqual([
      ['1', 4],
      ['2', 201],
      ['3', 6],
    ]);
    expect(df.colData).toStrictEqual([
      ['1', '2', '3'],
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
        columnTypes: ['string', 'integer'],
      }
    );
    expect(df.axes).toStrictEqual([
      ['a', 'b', 'c'],
      ['col1', 'col2'],
    ]);
    expect(df.data).toStrictEqual([
      ['1', 4],
      ['2', 5],
      ['3', 6],
    ]);
    expect(df.colData).toStrictEqual([
      ['1', '2', '3'],
      [4, 5, 6],
    ]);
  });

  test('2D: object array', () => {
    const df = new DataFrame(
      [
        { a: '1', b: '2', c: '3.1', d: 1 },
        { a: '1', b: '2', d: '4' },
        { c: '1', d: '2019-02-03', e: 0, f: 201 },
      ],
      {
        columnTypes: ['null', 'boolean', 'float', 'date', 'string'],
      }
    );
    expect(df.data).toStrictEqual([
      [null, true, 3.1, new Date(1), 'undefined', undefined],
      [null, true, NaN, new Date('4'), 'undefined', undefined],
      [undefined, false, 1, new Date('2019-02-03'), '0', 201],
    ]);
    expect(df.colData).toStrictEqual([
      [null, null, undefined],
      [true, true, false],
      [3.1, NaN, 1],
      [new Date(1), new Date('4'), new Date('2019-02-03')],
      ['undefined', 'undefined', '0'],
      [undefined, undefined, 201],
    ]);
  });

  test('2D: object array with extra indexes and columns', () => {
    const df = new DataFrame(
      [
        { a: 1, b: 4, c: 7 },
        { a: 2, b: 5, c: 201 },
        { a: 3, b: 201, c: 9 },
      ],
      { indexes: ['k', 'm', 'n'], columns: ['c', 'a'], columnTypes: ['string', ''] }
    );
    expect(df.data).toStrictEqual([
      ['7', 1],
      ['201', 2],
      ['9', 3],
    ]);
    expect(df.colData).toStrictEqual([
      ['7', '201', '9'],
      [1, 2, 3],
    ]);
  });

  test('2D: array object', () => {
    const df = new DataFrame(
      {
        a: [1, 2, null],
        b: [4, undefined, 6],
      },
      { columnTypes: ['string', 'integer'] }
    );
    expect(df.data).toStrictEqual([
      ['1', 4],
      ['2', NaN],
      ['null', 6],
    ]);
    expect(df.colData).toStrictEqual([
      ['1', '2', 'null'],
      [4, NaN, 6],
    ]);
  });

  test('2D: array object with extra indexes and columns', () => {
    const df = new DataFrame(
      {
        a: [1, 2, 201],
        b: ['201', 5, 6],
      },
      {
        indexes: ['p', 'q', 'r'],
        columns: ['b', 'a'],
        columnTypes: ['string', 'integer'],
      }
    );
    expect(df.data).toStrictEqual([
      ['201', 1],
      ['5', 2],
      ['6', 201],
    ]);
    expect(df.colData).toStrictEqual([
      ['201', '5', '6'],
      [1, 2, 201],
    ]);
  });
});
