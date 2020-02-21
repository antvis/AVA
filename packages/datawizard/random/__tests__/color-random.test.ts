import { ColorRandom } from '../src';
const R = new ColorRandom();

test('color', () => {
  expect(R.rgb()).toMatch(/rgb\(\d{1,3},\d{1,3},\d{1,3}\)/);
  expect(R.rgb({ casing: 'upper' })).toMatch(/RGB\(\d{1,3},\d{1,3},\d{1,3}\)/);
  expect(R.rgba()).toMatch(/rgba\(\d{1,3},\d{1,3},\d{1,3},0\.\d{1,4}\)/);
  expect(R.hsl()).toMatch(/hsl\(\d{1,3},(\d{1,2}\.\d{0,4}%),\d{1,2}\.\d{0,4}%\)/);
  expect(R.hsla()).toMatch(/hsla\(\d{1,3},(\d{1,2}\.\d{0,4}%),\d{1,2}\.\d{0,4}%,0\.\d{0,4}\)/);
  expect(R.hexcolor()).toMatch(/#[0-9a-f]{6}/);
  expect(R.hexcolor({ grayscale: true })).toMatch(/#(..)\1{2}/);
  expect(R.hexcolor({ casing: 'upper' })).toMatch(/#[0-9A-F]{6}/);
  expect(R.decimalcolor()).toBeLessThanOrEqual(parseInt('FFFFFF', 16));
  expect(R.database.colorKeywords.includes(R.colorname())).toBe(true);
});
