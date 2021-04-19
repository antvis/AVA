import { isFullCombination } from '../../../src/p_and_c/combinations';
import { Dataset } from '../../../src/data_structure/Dataset';

describe('isFullCombination', () => {
  describe('should accept valid data', () => {
    const validData = [
      { field1: 'X', field2: 'a', field3: 1 },
      { field1: 'X', field2: 'a', field3: 2 },
      { field1: 'X', field2: 'a', field3: 3 },
      { field1: 'X', field2: 'b', field3: 1 },
      { field1: 'X', field2: 'b', field3: 2 },
      { field1: 'X', field2: 'b', field3: 3 },
      { field1: 'Y', field2: 'a', field3: 1 },
      { field1: 'Y', field2: 'a', field3: 2 },
      { field1: 'Y', field2: 'a', field3: 3 },
      { field1: 'Y', field2: 'b', field3: 1 },
      { field1: 'Y', field2: 'b', field3: 2 },
      { field1: 'Y', field2: 'b', field3: 3 },
    ];

    const dataset = new Dataset('json', { source: validData });

    it('basic objects', () => {
      expect(isFullCombination(dataset)).toBe(true);
    });
  });

  describe('should reject invalid data', () => {
    it('empty array', () => {
      const invalidData = [
        { f1: 'a', f2: 1 },
        { f1: 'a', f2: 2 },
        { f1: 'b', f2: 1 },
      ];

      const dataset = new Dataset('json', { source: invalidData });

      expect(isFullCombination(dataset)).toBe(false);
    });
  });
});
