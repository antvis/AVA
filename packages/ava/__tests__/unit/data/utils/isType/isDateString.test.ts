import {
  getIsoDatePatterns,
  getIsoTimePatterns,
  isDateString,
  parseIsoDateString,
} from '../../../../../src/data/utils/isType/isDateString';

describe('func: isDateString', () => {
  test('check a string is a date', () => {
    expect(isDateString('1991')).toBe(true);
    expect(isDateString('1890')).toBe(true);
    expect(isDateString('1722')).toBe(false);
    expect(isDateString('3013')).toBe(false);
    expect(isDateString('2010 W08 1')).toBe(true);
    expect(isDateString('2010-W081')).toBe(false);
    expect(isDateString('2010-08-01')).toBe(true);
    expect(isDateString('20100801')).toBe(false);
    expect(isDateString('2010/08/01')).toBe(true);
    expect(isDateString('2020/01/01')).toBe(true);
    expect(isDateString('12/08/1999')).toBe(true);
    expect(isDateString('1/1/1999')).toBe(true);
    expect(isDateString('1999-01')).toBe(true);
    expect(isDateString('1999-200')).toBe(true);
    expect(isDateString('1999-367')).toBe(false);
    expect(isDateString('2010-08-01 20:00:00')).toBe(true);
    expect(isDateString('20:00:00')).toBe(true);
    expect(isDateString('20:00:00Z')).toBe(true);
    expect(isDateString('20:00:00+08:00')).toBe(true);
    expect(isDateString('20:00:00-08:00')).toBe(true);
    expect(isDateString('20:00:00.299-08:00')).toBe(true);
    expect(isDateString('20:00:00.299')).toBe(true);
    expect(isDateString('200000,299')).toBe(false);
  });

  test('strictly recognize number as date', () => {
    expect(isDateString('997815')).toBe(false);
    expect(isDateString('1135028')).toBe(false);
    expect(isDateString('5388715')).toBe(false);
  });
});

describe('func: parseIsoDateString', () => {
  test('parse a date string to date type', () => {
    expect(parseIsoDateString('1991')).toStrictEqual(new Date('1991-01-01 00:00:00.000'));
    expect(parseIsoDateString('2010 W08 1')).toStrictEqual(new Date('2010-02-15 00:00:00.000'));
    expect(parseIsoDateString('2010-W08')).toStrictEqual(new Date('2010-02-15 00:00:00.000'));
    expect(parseIsoDateString('2010-08-01')).toStrictEqual(new Date('2010-08-01 00:00:00.000'));
    expect(parseIsoDateString('20100801')).toStrictEqual(new Date('2010-08-01 00:00:00.000'));
    expect(parseIsoDateString('2010/08/01')).toStrictEqual(new Date('2010-08-01 00:00:00.000'));
    expect(parseIsoDateString('12/08/1999')).toStrictEqual(new Date('1999-12-08 00:00:00.000'));
    expect(parseIsoDateString('1/1/1999')).toStrictEqual(new Date('1999-01-01 00:00:00.000'));
    expect(parseIsoDateString('1999-01')).toStrictEqual(new Date('1999-01 00:00:00.000'));
    expect(parseIsoDateString('1999-200')).toStrictEqual(new Date(1999, 0, 200));
    expect(parseIsoDateString('1999-367')).toBe(null);
    expect(parseIsoDateString('2010-08-01 20:00:00')).toStrictEqual(new Date('2010-08-01 20:00:00.000'));
    expect(parseIsoDateString('20:00:00')).toStrictEqual(new Date('01-01 20:00:00'));
    expect(parseIsoDateString('20:00:00Z')).toStrictEqual(new Date('01-01 20:00:00Z'));
    expect(parseIsoDateString('20:00:00+08:00')).toStrictEqual(new Date('01-01 20:00:00+08:00'));
    expect(parseIsoDateString('20:00:00-08:00')).toStrictEqual(new Date('01-01 20:00:00-08:00'));
    expect(parseIsoDateString('20:00:00.299-08:00')).toStrictEqual(new Date('01-01 20:00:00.299-08:00'));
    expect(parseIsoDateString('20:00:00.299')).toStrictEqual(new Date('01-01 20:00:00.299'));
  });

  test('strictly recognize number as date', () => {
    expect(isDateString('997815')).toBe(false);
    expect(isDateString('1135028')).toBe(false);
    expect(isDateString('5388715')).toBe(false);
  });
});

describe('Not strict', () => {
  const isoDatePatternsNotStrict = getIsoDatePatterns(false);
  const isoTimePatternsNotStrict = getIsoTimePatterns(false);

  expect(isoDatePatternsNotStrict).toStrictEqual([
    '(?<year>(18|19|20)\\d{2})',
    '(?<year>(18|19|20)\\d{2})([-_./\\s])?W(?<week>[0-4]\\d|5[0-2])(([-_./\\s])?(?<weekday>[1-7]))?',
    '(?<month>0?[1-9]|1[012])([-_./\\s])?(?<day>0?[1-9]|[12]\\d|3[01])([-_./\\s])?(?<year>(18|19|20)\\d{2})',
    '(?<year>(18|19|20)\\d{2})([-_./\\s])?(?<month>0?[1-9]|1[012])([-_./\\s])?(?<day>0?[1-9]|[12]\\d|3[01])',
    '(?<year>(18|19|20)\\d{2})([-_./\\s])?(?<month>0?[1-9]|1[012])',
    '(?<year>(18|19|20)\\d{2})([-_./\\s])?(?<yearDay>(([0-2]\\d|3[0-5])\\d)|36[0-6])',
  ]);

  expect(isoTimePatternsNotStrict).toStrictEqual([
    '(?<hour>(0?\\d|[012345]\\d)):?(?<minute>(0?\\d|[012345]\\d)):?(?<second>(0?\\d|[012345]\\d))([.,](?<millisecond>\\d{1,4}))?(?<offset>Z|[+-](0?\\d|1\\d|2[0-4])(:(0?\\d|[012345]\\d))?)?',
    '(?<hour>(0?\\d|[012345]\\d)):?(?<minute>(0?\\d|[012345]\\d))?(?<offset>Z|[+-](0?\\d|1\\d|2[0-4])(:(0?\\d|[012345]\\d))?)',
  ]);
});
