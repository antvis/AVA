import { isBoolean } from '../../src/utils';

test('isBoolean', () => {
  const data1 = true;
  expect(isBoolean(data1)).toBe(true);

  const data2 = ['是', '否'];
  expect(isBoolean(data2, true)).toBe(true);
});
