import { isDataRowObject } from '../../src';

describe('isDataRowObject', () => {
  describe('should accept objects', () => {
    it('empty objects', () => {
      expect(isDataRowObject({})).toBe(true);
    });

    it('basic objects', () => {
      expect(isDataRowObject({ a: 1, b: 2, c: 3 })).toBe(true);
    });
  });

  describe('should reject arrays', () => {
    it('empty array', () => {
      expect(isDataRowObject([])).toBe(false);
    });

    it('basic arrays', () => {
      expect(isDataRowObject([1])).toBe(false);
      expect(isDataRowObject([1, 2, 3])).toBe(false);
      expect(isDataRowObject([1, 'a', true])).toBe(false);
    });
  });

  describe('should reject functions', () => {
    it('empty functions', () => {
      expect(isDataRowObject(() => {})).toBe(false);
    });

    it('basic functions', () => {
      expect(isDataRowObject((x: any) => x)).toBe(false);
      expect(isDataRowObject((x: number) => x * 2)).toBe(false);
    });
  });
});
