import DataFrame from '../../../../../../src/data/dataset/field/dataFrame';

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
