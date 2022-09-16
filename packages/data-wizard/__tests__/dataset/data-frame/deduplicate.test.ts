import DataFrame from '../../../src/dataset/data-frame';

describe('DataFrame get value functions', () => {
  const df = new DataFrame([
    { a: 'a1', b: 'b1', c: 7 },
    { a: 'a1', b: 'b1', c: 8 },
    { a: 'a2', b: 'b1', c: 9 },
  ]);

  test('deduplicate', () => {
    const deduplicatedDf = df.deduplicate().data;
    expect(deduplicatedDf).toStrictEqual(
      new DataFrame([
        { a: 'a1', b: 'b1', c: 15 },
        { a: 'a2', b: 'b1', c: 9 },
      ]).data
    );
  });
});
