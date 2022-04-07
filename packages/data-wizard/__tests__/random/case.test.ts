import { BasicRandom, TextRandom, AddressRandom } from '../../src/random';

describe('Case test', () => {
  test('Generate object array', () => {
    const NUM = 10000;
    const results = [];
    for (let i = 0; i < NUM; i += 1) {
      results.push({
        name: new TextRandom().givenName(),
        age: new BasicRandom().integer({ min: 18, max: 36 }),
        salary: new BasicRandom().integer({ min: 5000, max: 36000 }),
        city: new AddressRandom().city(),
      });
    }

    expect(results.length).toBe(NUM);
  });

  test('Generate object array with unique object', () => {
    const NUM = 1000;
    const results = [];
    for (let i = 0; i < NUM; i += 1) {
      const result = {
        name: new TextRandom().givenName(),
        age: new BasicRandom().integer({ min: 18, max: 36 }),
        salary: new BasicRandom().integer({ min: 5000, max: 36000 }),
        city: new AddressRandom().city(),
      };
      expect(results).not.toContainEqual(result);
      results.push(result);
    }
  });
});
