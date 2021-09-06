import { LocationRandom } from '../../src/random';

const R = new LocationRandom();

test('location', () => {
  expect(Number.parseFloat(R.coordinates({ maxLat: 20, minLat: 10 }).split(', ')[1])).toBeGreaterThanOrEqual(10);
  expect(
    Number.parseFloat(R.coordinates({ maxLat: 20, minLat: 10, maxLong: 20, minLong: 10 }).split(', ')[0])
  ).toBeGreaterThanOrEqual(10);
});
