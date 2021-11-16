import { TextRandom } from '../../src/random';

const R = new TextRandom();
const { database } = R;

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
  expect(R.phone({ asterisk: true })).toMatch(/1[345789]\d\*{4}\d{4}/);
  expect(R.phone({ mobile: false, formatted: true, asterisk: true })).toMatch(/\d{3,4}-\d{3}\*{2,3}\d{2}/);
  expect(R.phone({ mobile: false, asterisk: true })).toMatch(/\d{3,4}\d{3}\*{2,3}\d{2}/);
  expect(R.phone({ formatted: true, startNum: '182' })).toMatch(new RegExp('182-\\d{4}-\\d{4}'));
  expect(R.phone({ startNum: '144' })).toMatch(new RegExp('144\\d{8}'));
  expect(R.phone({ mobile: false, formatted: true, startNum: '021' })).toMatch(new RegExp('021-\\d{7,8}'));
  expect(R.phone({ mobile: false, startNum: '010' })).toMatch(new RegExp('010\\d{7,8}'));
  expect(R.phone({ formatted: true, asterisk: true, startNum: '143' })).toMatch(new RegExp('143-\\*{4}-\\d{4}'));
  expect(R.phone({ asterisk: true, startNum: '13' })).toMatch(/1[345789]\d\*{4}\d{4}/);
  expect(R.phone({ asterisk: true, startNum: '186' })).toMatch(new RegExp('186\\*{4}\\d{4}'));
  expect(R.phone({ mobile: false, formatted: true, asterisk: true, startNum: '010' })).toMatch(
    new RegExp('010-\\d{3}\\*{2,3}\\d{2}')
  );
  expect(R.phone({ mobile: false, asterisk: true, startNum: '010' })).toMatch(new RegExp('010\\d{3}\\*{2,3}\\d{2}'));
  expect(R.name()).toContain(' ');
  expect(R.name({ gender: 'female' })).toContain(' ');
  expect(R.cName()).not.toContain(' ');
  expect(R.cGivenName({ length: 3 })).toHaveLength(3);
  expect(R.cWord().length).toBeGreaterThanOrEqual(2);
  expect(R.n(R.cWord, 100, { length: 5 }).every((item) => item.length === 5)).toBe(true);
  expect(R.cSentence().endsWith('。')).toBe(true);
  expect(R.cParagraph().split('。').length).toBeGreaterThan(3);
  const { cZodiac } = R.database;
  expect(cZodiac['zh-CN'].includes(R.cZodiac())).toBe(true);
  expect(cZodiac['en-US'].includes(R.cZodiac({ locale: 'en-US' }))).toBe(true);
});

test('extend', () => {
  TextRandom.mixin({
    testq() {
      return 123;
    },
  });
  // @ts-ignore
  expect(new TextRandom().testq()).toBe(123);
});
