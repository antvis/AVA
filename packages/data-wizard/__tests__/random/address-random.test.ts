import { AddressRandom } from '../../src/random';

const R = new AddressRandom();

test('AddressRandom', () => {
  expect(typeof R.city()).toBe('string');
  expect(typeof R.road()).toBe('string');
  expect(typeof R.province()).toBe('string');
  expect(typeof R.district()).toBe('string');
  expect(R.n(R.district, 1000)).toHaveLength(1000);
  expect(typeof R.address()).toBe('string');
  expect(typeof R.country()).toBe('string');
  expect(R.postcode()).toMatch(/\d{6}/);
});
