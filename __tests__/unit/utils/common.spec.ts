import { assert, isParentChild, range, sign, unique } from '../../../src/utils/common';

describe('common', () => {
  test('sign', () => {
    expect(sign(10)).toBe(1);
    expect(sign(-5)).toBe(-1);
    expect(sign(0)).toBe(0);
  });

  test('unique', () => {
    const data = [1, 2, 3, 3, 2, 1];
    expect(unique(data)).toStrictEqual([
      [1, 2, 3],
      [2, 2, 2],
    ]);
  });

  test('range', () => {
    const data = 4;
    expect(range(data)).toStrictEqual([0, 1, 2, 3]);
  });

  test('assert', () => {
    expect(() => assert(false, 'It is false!')).toThrow('It is false!');
  });

  test('isParentChild', () => {
    expect(isParentChild(['a', 'b', 'c'], [1, 2, 3])).toBe(true);
    expect(isParentChild(['a', 'a', 'c'], [1, 1, 3])).toBe(true);
    expect(isParentChild(['a', 'a', 'c'], [1, 2, 3])).toBe(true);
    expect(isParentChild(['a', 'b', 'c'], [1, 1, 3])).toBe(false);
  });
});
