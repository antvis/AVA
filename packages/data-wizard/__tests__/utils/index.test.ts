import * as utils from '../../src/utils';

test('isNull', () => {
  const data = 'null';
  expect(utils.isNull(data)).toBe(true);
});

test('isString', () => {
  const data = 'str';
  expect(utils.isString(data)).toBe(true);
});

test('isNumber', () => {
  const data = 201;
  expect(utils.isNumber(data)).toBe(true);
});

test('isDigit', () => {
  const data = '5.2';
  expect(utils.isDigit(data)).toBe(true);
});

test('isInteger', () => {
  const data1 = 1;
  expect(utils.isInteger(data1)).toBe(true);

  const data2 = '1';
  expect(utils.isInteger(data2, true)).toBe(true);
});

test('isFloat', () => {
  const data1 = 1.2;
  expect(utils.isFloat(data1)).toBe(true);

  const data2 = '1.2';
  expect(utils.isFloat(data2, true)).toBe(true);
});

test('isDate', () => {
  const data1 = new Date();
  expect(utils.isDate(data1)).toBe(true);

  const data2 = '2021-09-24';
  expect(utils.isDate(data2, true)).toBe(true);
});

test('isBoolean', () => {
  const data1 = true;
  expect(utils.isBoolean(data1)).toBe(true);

  const data2 = ['是', '否'];
  expect(utils.isBoolean(data2, true)).toBe(true);
});

test('isObject', () => {
  const data = { a: 1 };
  expect(utils.isObject(data)).toBe(true);
});

test('isArray', () => {
  const data = [1, 2, 3];
  expect(utils.isArray(data)).toBe(true);
});

test('isBasicType', () => {
  expect(utils.isBasicType(5)).toBeTruthy();
});

test('unique', () => {
  const data = [1, 2, 3, 3, 2, 1];
  expect(utils.unique(data)).toStrictEqual([1, 2, 3]);
});

test('range', () => {
  const data = 4;
  expect(utils.range(data)).toStrictEqual([0, 1, 2, 3]);
});

test('assert', () => {
  expect(() => utils.assert(false, 'It is false!')).toThrow('It is false!');
});

test('isParentChild', () => {
  expect(utils.isParentChild(['a', 'b', 'c'], [1, 2, 3])).toBe(true);
  expect(utils.isParentChild(['a', 'a', 'c'], [1, 1, 3])).toBe(true);
  expect(utils.isParentChild(['a', 'a', 'c'], [1, 2, 3])).toBe(true);
  expect(utils.isParentChild(['a', 'b', 'c'], [1, 1, 3])).toBe(false);
});
