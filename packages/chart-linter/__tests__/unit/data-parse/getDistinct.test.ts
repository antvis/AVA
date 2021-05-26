import { getDistinct } from '../../../src/data-parse';

describe('UNIT TEST - chart-linter/data-parse/getDistinct', () => {
  test('should work', () => {
    expect(getDistinct([1, 2, 3, 4, 5])).toBe(5);
    expect(getDistinct([1, 1, 3, 4, 5])).toBe(4);
    expect(getDistinct([1, '1', 3, 4, 5])).toBe(5);
    expect(getDistinct(['a', 'b', 'A'])).toBe(3);
  });

  test('should handle empty', () => {
    expect(getDistinct([])).toBe(0);
  });
});
