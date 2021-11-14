import { ColorRandom } from '../../src/random';

const R = new ColorRandom();

test('color', () => {
  expect(R.rgb()).toMatch(/rgb\(\d{1,3},\d{1,3},\d{1,3}\)/);
  expect(R.rgb({ casing: 'upper' })).toMatch(/RGB\(\d{1,3},\d{1,3},\d{1,3}\)/);
  expect(R.rgb({ minR: 0, maxR: 255, minG: 0, maxG: 255, minB: 0, maxB: 255 })).toMatch(
    /rgb\(\d{1,3},\d{1,3},\d{1,3}\)/
  );
  expect(R.rgba()).toMatch(/rgba\(\d{1,3},\d{1,3},\d{1,3},0\.\d{1,4}\)/);
  expect(R.hsl()).toMatch(/hsl\(\d{1,3},(\d{1,2}\.\d{0,4}%),\d{1,2}\.\d{0,4}%\)/);
  expect(R.hsla()).toMatch(/hsla\(\d{1,3},(\d{1,2}\.\d{0,4}%),\d{1,2}\.\d{0,4}%,0\.\d{0,4}\)/);
  expect(R.hexColor()).toMatch(/#[0-9a-f]{6}/);
  expect(R.hexColor({ grayscale: true })).toMatch(/#(..)\1{2}/);
  expect(R.hexColor({ casing: 'upper' })).toMatch(/#[0-9A-F]{6}/);
  expect(R.decimalColor()).toBeLessThanOrEqual(0xffffff);
  expect(R.database.colorKeywords.includes(R.colorName())).toBe(true);
});
