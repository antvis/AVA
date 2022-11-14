import {
  isArray,
  isBasicType,
  isBoolean,
  isDate,
  isFloat,
  isInteger,
  isNil,
  isNumber,
  isObject,
  isString,
} from '../../../../data/utils/isType';

test('isNull', () => {
  const data = 'null';
  expect(isNil(data)).toBe(true);
});

test('isString', () => {
  const data = 'str';
  expect(isString(data)).toBe(true);
});

test('isNumber', () => {
  const data1 = 201;
  expect(isNumber(data1)).toBe(true);

  const data2 = '5.2';
  expect(isNumber(data2, true)).toBe(true);
});

test('isInteger', () => {
  const data1 = 1;
  expect(isInteger(data1)).toBe(true);

  const data2 = '1';
  expect(isInteger(data2, true)).toBe(true);
});

test('isFloat', () => {
  const data1 = 1.2;
  expect(isFloat(data1)).toBe(true);

  const data2 = '1.2';
  expect(isFloat(data2, true)).toBe(true);
});

test('isDate', () => {
  const data1 = new Date();
  expect(isDate(data1)).toBe(true);

  const data2 = '2021-09-24';
  expect(isDate(data2, true)).toBe(true);
});

test('isBoolean', () => {
  const data1 = true;
  expect(isBoolean(data1)).toBe(true);

  const data2 = ['是', '否'];
  expect(isBoolean(data2, true)).toBe(true);
});

test('isObject', () => {
  const data = { a: 1 };
  expect(isObject(data)).toBe(true);
});

test('isArray', () => {
  const data = [1, 2, 3];
  expect(isArray(data)).toBe(true);
});

test('isBasicType', () => {
  expect(isBasicType(5)).toBeTruthy();
});
