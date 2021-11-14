import { BasicRandom, Random } from '../../src/random';

describe.each([
  [new BasicRandom(), 'has no seed'],
  [new BasicRandom(100), 'has a number seed'],
  [new BasicRandom(Math.random), 'has a string seed'],
])('%s', (R: BasicRandom) => {
  test('bool', () => {
    expect(typeof R.boolean()).toBe('boolean');
    const ps = JSON.stringify(R.pickset([1, 2], 10));
    expect(ps === JSON.stringify([1, 2]) || ps === JSON.stringify([2, 1])).toBeTruthy();
    expect(() => R.boolean({ likelihood: 1000 })).toThrow();
  });

  test('float', () => {
    expect(typeof R.float()).toBe('number');
  });

  test('integer', () => {
    expect(typeof R.integer()).toBe('number');
    expect(R.integer({ min: 10, max: 10 })).toBe(10);
  });

  test('natural', () => {
    expect(R.natural()).toBeGreaterThanOrEqual(0);
  });

  test('shuffle', () => {
    expect(R.shuffle([1, 2, 3])).toHaveLength(3);
    expect(R.shuffle([4, 2, 3, 1])).toHaveLength(4);
  });

  test('pickOne', () => {
    expect([1, 2, 3].includes(R.pickone([1, 2, 3]))).toBe(true);
  });

  test('pickSet', () => {
    const arr = [1, 2, 3];
    expect(R.pickset(arr)).toHaveLength(1);
    expect(R.pickset([1, 2, 3], 2).every((item: number) => arr.includes(item))).toBe(true);
    expect(R.pickset([1, 2, 3], 0)).toEqual([]);
  });

  test('randexp', () => {
    expect(R.randexp('\\d{4}-\\d{8}')).toMatch(/\d{4}-\d{8}/);
  });
});

test('extend', () => {
  Random.mixin({
    test() {
      return 123;
    },
    percent() {
      return `${this.float({ min: 0, max: 100, fixed: 2 })}%`;
    },
    user() {
      return {
        name: this.cName(),
        age: this.integer({ max: 50, min: 25 }),
      };
    },
  });
  const R = new Random();
  // @ts-ignore
  expect(new Random().test()).toBe(123);
  // @ts-ignore
  R.percent(); // '10.12%'
  // @ts-ignore
  R.n(R.percent, 2); // ['12.10%', '25.22%']
  // @ts-ignore
  const user = R.user();
  expect(typeof user.name).toBe('string');
  expect(typeof user.age).toBe('number');
});
