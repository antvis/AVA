import { CKBOptions } from '../src/options';

test('OPTIONS', () => {
  const options1 = CKBOptions();
  const keys1 = Object.keys(options1);
  expect(
    keys1.every((key) => ['family', 'category', 'purpose', 'coord', 'shape', 'channel', 'lom', 'recRate'].includes(key))
  ).toBe(true);
  expect(keys1.every((key) => options1[key])).toBe(true);
  expect(options1.purpose.includes('Trend')).toBe(true);
  expect(options1.purpose.includes('趋势')).toBe(false);

  const options2 = CKBOptions('zh-CN');
  expect(options2.purpose.includes('Trend')).toBe(false);
  expect(options2.purpose.includes('趋势')).toBe(true);
});
