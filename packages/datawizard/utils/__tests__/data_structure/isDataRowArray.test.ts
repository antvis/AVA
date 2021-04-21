import { isDataRowArray } from '../../src';

describe('isDataRowArray', () => {
  describe('should accept arrays', () => {
    it('empty array', () => {
      expect(isDataRowArray([])).toBe(true);
    });

    it('basic arrays', () => {
      expect(isDataRowArray([1])).toBe(true);
      expect(isDataRowArray([1, 2, 3])).toBe(true);
      expect(isDataRowArray([1, 'a', true])).toBe(true);
    });
  });

  describe('should reject objects', () => {
    it('empty objects', () => {
      expect(isDataRowArray({})).toBe(false);
    });

    it('basic objects', () => {
      expect(isDataRowArray({ a: 1, b: 2, c: 3 })).toBe(false);
    });
  });
});
