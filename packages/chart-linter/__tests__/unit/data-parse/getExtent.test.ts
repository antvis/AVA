import { getExtent } from '../../../src/data-parse';

describe('UNIT TEST - chart-linter/data-parse/getExtent', () => {
  test('should work', () => {
    expect(getExtent([1, 2, 3, 4, 5])).toEqual([1, 5]);
    expect(getExtent([-1, 0, 3, 4, 5])).toEqual([-1, 5]);
    expect(getExtent([1, 1, 2, 5, 5])).toEqual([1, 5]);
    expect(getExtent([1, 1, 1, 1, 1])).toEqual([1, 1]);
    expect(getExtent([5])).toEqual([5, 5]);
  });

  test('should handle empty', () => {
    // TODO: [Infinity, -Infinity] or [-Infinity, Infinity] ?
    expect(getExtent([])).toEqual([Infinity, -Infinity]);
  });
});
