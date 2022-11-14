import { unique, range, assert, isParentChild } from '../../../data/utils/common';

test('unique', () => {
  const data = [1, 2, 3, 3, 2, 1];
  expect(unique(data)).toStrictEqual([1, 2, 3]);
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
