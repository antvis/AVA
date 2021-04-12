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
});
