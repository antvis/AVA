import Series from '../../src/dataset/series';

describe('New Series', () => {
  test('1D: object', () => {
    const s = new Series({ a: 1, b: 2, c: 3 });
    // console.log('1D: object');
    // console.log(s);
    expect(s.data).toStrictEqual([1, 2, 3]);
    expect(s.colData).toStrictEqual([1, 2, 3]);
    expect(s.axes).toStrictEqual([['a', 'b', 'c']]);
  });

  test('1D: array', () => {
    const s = new Series([1, 2, 3]);
    // console.log('1D: array');
    // console.log(s);
    expect(s.data).toStrictEqual([1, 2, 3]);
    expect(s.colData).toStrictEqual([1, 2, 3]);
    expect(s.axes).toStrictEqual([[0, 1, 2]]);
  });

  test('1D: basic type', () => {
    const s = new Series(1, { index: [0, 1, 2] });
    // console.log('1D: basic type');
    // console.log(s);
    expect(s.data).toStrictEqual([1, 1, 1]);
    expect(s.colData).toStrictEqual([1, 1, 1]);
    expect(s.axes).toStrictEqual([[0, 1, 2]]);
  });
});

describe('Series Get Value Functions', () => {
  const s = new Series({ a: 1, b: 2, c: 3 });
  // console.log('s', s);

  test('get', () => {
    const s2 = new Series([1, 2, 3]);
    // number
    const rowLocNum = s2.get(0);
    // console.log('get: rowLocNum', rowLocNum);
    expect(rowLocNum).toStrictEqual(1);

    const rowLocNumArr = s2.get([0, 2]);
    // console.log('get: rowLocNumArr', rowLocNumArr);
    expect(rowLocNumArr).toStrictEqual(
      new Series([1, 3], {
        index: [0, 2],
      })
    );

    const numStrSlice = s2.get('0:2');
    // console.log('get: numStrSlice', numStrSlice);
    expect(numStrSlice).toStrictEqual(
      new Series([1, 2], {
        index: [0, 1],
      })
    );

    // string
    const rowLocStr = s.get('a');
    // console.log('get: rowLocStr', rowLocStr);
    expect(rowLocStr).toStrictEqual(1);

    const rowLocStrArr = s.getByIntegerIndex([0, 2]);
    // console.log('get: rowLocStrArr', rowLocStrArr);
    expect(rowLocStrArr).toStrictEqual(
      new Series([1, 3], {
        index: ['a', 'c'],
      })
    );

    const rowLocStrSlice = s.get('a:c');
    // console.log('get: rowLocStrSlice', rowLocStrSlice);
    expect(rowLocStrSlice).toStrictEqual(
      new Series([1, 2], {
        index: ['a', 'b'],
      })
    );
  });

  test('getByIntegerIndex', () => {
    const rowLocInt = s.getByIntegerIndex(0);
    // console.log('getByIntegerIndex: rowLocInt', rowLocInt);
    expect(rowLocInt).toStrictEqual(1);

    const rowLocIntArr = s.getByIntegerIndex([0, 2]);
    // console.log('getByIntegerIndex: rowLocIntArr', rowLocIntArr);
    expect(rowLocIntArr).toStrictEqual(
      new Series([1, 3], {
        index: ['a', 'c'],
      })
    );

    const rowLocStrSlice = s.getByIntegerIndex('0:2');
    // console.log('getByIntegerIndex: rowLocStrSlice', rowLocStrSlice);
    expect(rowLocStrSlice).toStrictEqual(
      new Series([1, 2], {
        index: ['a', 'b'],
      })
    );
  });
});
