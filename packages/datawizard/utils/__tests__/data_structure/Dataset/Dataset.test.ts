import { Dataset } from '../../../src/data_structure/Dataset';

const data1 = [
  { a: 1, b: 2, c: 3 },
  { a: 4, b: 5, c: 6 },
  { a: 7, b: 8, c: 9 },
];

describe('Dataset class', () => {
  describe('should work', () => {
    it('basic usage', () => {
      const dataset = new Dataset('json', { source: data1 });
      const data = dataset.toJson();
      expect(data).toStrictEqual(data1);
    });
  });

  describe('json data', () => {
    const data = data1;
    it('normal json', () => {
      const dataset = new Dataset('json', { source: data });
      expect(dataset.toJson()).toStrictEqual(data);
    });

    it('json with empty', () => {
      const data = [
        { a: 1, b: undefined, c: 3 },
        { a: 4, b: 5, c: null },
        { b: 8, c: 9 },
      ];

      const expectJson = [
        { a: 1, b: undefined, c: 3 },
        { a: 4, b: 5, c: undefined },
        { a: undefined, b: 8, c: 9 },
      ];

      const dataset = new Dataset('json', { source: data });
      expect(dataset.toJson()).toStrictEqual(expectJson);
    });
  });

  describe('columns data', () => {
    const data = [
      [1, 2, 3, 4, 5],
      ['a', 'b', 'c', 'd', 'e'],
    ];
    const fields = ['num', 'cha'];

    it('normal columns', () => {
      const expectJson = [
        { num: 1, cha: 'a' },
        { num: 2, cha: 'b' },
        { num: 3, cha: 'c' },
        { num: 4, cha: 'd' },
        { num: 5, cha: 'e' },
      ];

      const dataset = new Dataset('columns', { source: data, columns: fields });
      expect(dataset.toJson()).toStrictEqual(expectJson);
    });

    it('without columns name', () => {
      const expectJson = [
        { col_0: 1, col_1: 'a' },
        { col_0: 2, col_1: 'b' },
        { col_0: 3, col_1: 'c' },
        { col_0: 4, col_1: 'd' },
        { col_0: 5, col_1: 'e' },
      ];

      const dataset = new Dataset('columns', { source: data });
      expect(dataset.toJson()).toStrictEqual(expectJson);
    });

    it('without data', () => {
      const dataset1 = new Dataset('columns', { source: undefined });
      expect(dataset1.toJson()).toStrictEqual([]);

      const dataset2 = new Dataset('columns', { source: undefined, columns: fields });
      expect(dataset2.toJson()).toStrictEqual([]);
    });

    it('unbalanced fields', () => {
      const data1 = [
        [1, 2, 3],
        ['a', 'b', 'c', 'd', 'e'],
      ];
      const expectJson1 = [
        { num: 1, cha: 'a' },
        { num: 2, cha: 'b' },
        { num: 3, cha: 'c' },
        { num: undefined, cha: 'd' },
        { num: undefined, cha: 'e' },
      ];

      const dataset1 = new Dataset('columns', { source: data1, columns: fields });
      expect(dataset1.toJson()).toStrictEqual(expectJson1);

      const data2 = [
        [1, 2, 3, 4, 5],
        ['a', 'b', 'c', 'd'],
      ];
      const expectJson2 = [
        { num: 1, cha: 'a' },
        { num: 2, cha: 'b' },
        { num: 3, cha: 'c' },
        { num: 4, cha: 'd' },
        { num: 5, cha: undefined },
      ];

      const dataset2 = new Dataset('columns', { source: data2, columns: fields });
      expect(dataset2.toJson()).toStrictEqual(expectJson2);
    });
  });

  describe('rows data', () => {
    const data = [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ];
    const fields = ['cha', 'num'];

    it('normal rows', () => {
      const expectJson = [
        { num: 1, cha: 'a' },
        { num: 2, cha: 'b' },
        { num: 3, cha: 'c' },
        { num: 4, cha: 'd' },
        { num: 5, cha: 'e' },
      ];

      const dataset = new Dataset('rows', { source: data, columns: fields });
      expect(dataset.toJson()).toStrictEqual(expectJson);
    });

    it('without columns name', () => {
      const expectJson = [
        { col_0: 'a', col_1: 1 },
        { col_0: 'b', col_1: 2 },
        { col_0: 'c', col_1: 3 },
        { col_0: 'd', col_1: 4 },
        { col_0: 'e', col_1: 5 },
      ];

      const dataset = new Dataset('rows', { source: data });
      expect(dataset.toJson()).toStrictEqual(expectJson);
    });

    it('without data', () => {
      const dataset1 = new Dataset('rows', { source: undefined });
      expect(dataset1.toJson()).toStrictEqual([]);

      const dataset2 = new Dataset('rows', { source: undefined, columns: fields });
      expect(dataset2.toJson()).toStrictEqual([]);
    });

    it('unbalanced rows', () => {
      const data = [
        ['a', 1],
        ['b', 2, true], //
        ['c', 3],
        ['d', 4],
        ['e'], //
      ];
      const expectJson = [
        { num: 1, cha: 'a', col_2: undefined },
        { num: 2, cha: 'b', col_2: true },
        { num: 3, cha: 'c', col_2: undefined },
        { num: 4, cha: 'd', col_2: undefined },
        { num: undefined, cha: 'e', col_2: undefined },
      ];

      const dataset = new Dataset('rows', { source: data, columns: fields });
      expect(dataset.toJson()).toStrictEqual(expectJson);
    });
  });
});
