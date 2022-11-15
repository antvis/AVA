import { isAxis, generateArrayIndex } from '../../src/dataset/utils';

test('isAxis', () => {
  expect(isAxis(1)).toBeTruthy();
  expect(isAxis('axis')).toBeTruthy();
});

test('generateArrayIndex', () => {
  const data = ['a', 'b', 'c', 'd', 'e', 'f'];
  expect(generateArrayIndex(['a', 'b', 'c', 'd', 'e', 'f'])).toStrictEqual([0, 1, 2, 3, 4, 5]);
  expect(generateArrayIndex(['a', 'b', 'c', 'd', 'e', 'f'], [6, 7, 8, 9, 10, 11])).toStrictEqual([6, 7, 8, 9, 10, 11]);
  const extraIndex = [1, 2, 3];
  expect(() => generateArrayIndex(['a', 'b', 'c', 'd', 'e', 'f'], [1, 2, 3])).toThrow(
    `Index length is ${extraIndex.length}, but data size is ${data.length}`
  );
});
