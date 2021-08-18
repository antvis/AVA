import { CKBJson, CKBOptions, addChart } from '../src/index';

test('knowledge', () => {
  expect(!!CKBJson()).toBe(true);
  expect(!!CKBOptions()).toBe(true);
  expect(typeof addChart).toBe('function');
});
