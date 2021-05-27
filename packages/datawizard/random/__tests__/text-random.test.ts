import { TextRandom } from '../src';
const R = new TextRandom();
const database = R.database;
test('string', () => {
  expect(typeof R.string()).toBe('string');
});
test('character111', () => {
  const char = R.character({ lower: true, upper: false, symbols: false, numeric: false });
  expect(database.character.lower).toContain(char);
  expect(R.character({ pool: 'a' })).toBe('a');
  expect(R.word({ length: 10 })).toHaveLength(10);
  expect(R.word({ syllables: 2 })).toMatch(/\w{2,6}/);
  expect(R.syllable({ capitalize: true })).toMatch(/^[A-Z]/);
  expect(R.word({ syllables: 2, capitalize: true })).toMatch(/^[A-Z]\w{1,5}/);
  expect(R.sentence().split(' ').length).toBeGreaterThan(11);
  expect(R.paragraph().split('.').length).toBeGreaterThan(3);
  expect(R.phone({ formatted: true })).toMatch(/\d{3}-\d{4}-\d{4}/);
  expect(R.phone()).toMatch(/\d{11}/);
  expect(R.phone({ mobile: false, formatted: true })).toMatch(/\d{3,4}-\d{7,8}/);
  expect(R.phone({ mobile: false })).toMatch(/\d{10,12}/);
  expect(R.phone({ formatted: true, asterisk: true })).toMatch(/1[345789]\d-\*{4}-\d{4}/);
  expect(R.phone({ asterisk: true })).toMatch(/1[345789]\d{2}\*{4}\d{4}/);
  expect(R.phone({ mobile: false, formatted: true, asterisk: true })).toMatch(/\d{3,4}-\d{3}\*{2,3}\d{2}/);
  expect(R.phone({ mobile: false, asterisk: true })).toMatch(/\d{3,4}\d{3}\*{2,3}\d{2}/);
  expect(R.name()).toContain(' ');
  expect(R.cname()).not.toContain(' ');
  expect(R.clastname({ length: 3 })).toHaveLength(3);
  expect(R.cword().length).toBeGreaterThanOrEqual(2);
  expect(R.n(R.cword, 100, { length: 5 }).every((item) => item.length === 5)).toBe(true);
  expect(R.csentence().endsWith('。')).toBe(true);
  expect(R.cparagraph().split('。').length).toBeGreaterThan(3);
  const cZodiac = R.database.cZodiac;
  expect(cZodiac['zh-CN'].includes(R.cZodiac())).toBe(true);
  expect(cZodiac['en-US'].includes(R.cZodiac({ locale: 'en-US' }))).toBe(true);
});

test('extend', () => {
  TextRandom.mixin({
    testq: function() {
      return 123;
    },
  });
  // @ts-ignore
  expect(new TextRandom().testq()).toBe(123);
});
