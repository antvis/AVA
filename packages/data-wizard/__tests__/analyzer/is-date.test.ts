import { isDateString, getIsoDates, getIsoTimes } from '../../src/analyzer/is-date';

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

describe('Not strict', () => {
  const isoDatatsNotStrict = getIsoDates(false);
  const isoTimesNotStrict = getIsoTimes(false);

  expect(isoDatatsNotStrict).toStrictEqual([
    '(18|19|20)\\d{2}',
    '(18|19|20)\\d{2}([-_./\\s])?W([0-4]\\d|5[0-2])(([-_./\\s])?([1-7]))?',
    '(0?[1-9]|1[012])([-_./\\s])?(0?[1-9]|[12]\\d|3[01])([-_./\\s])?(18|19|20)\\d{2}',
    '(18|19|20)\\d{2}([-_./\\s])?(0?[1-9]|1[012])([-_./\\s])?(0?[1-9]|[12]\\d|3[01])',
    '(18|19|20)\\d{2}([-_./\\s])?(0?[1-9]|1[012])',
    '(18|19|20)\\d{2}([-_./\\s])?((([0-2]\\d|3[0-5])\\d)|36[0-6])',
  ]);

  expect(isoTimesNotStrict).toStrictEqual([
    '(0?\\d|1\\d|2[0-4]):?(0?\\d|[012345]\\d):?(0?\\d|[012345]\\d)([.,]\\d{1,4})?(Z|[+-](0?\\d|1\\d|2[0-4])(:(0?\\d|[012345]\\d))?)?',
    '(0?\\d|1\\d|2[0-4]):?(0?\\d|[012345]\\d)?(Z|[+-](0?\\d|1\\d|2[0-4])(:(0?\\d|[012345]\\d))?)',
  ]);
});
