import { isDateString } from '../src/is-date';

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
    expect(isDateString('1999-200')).toBe(true);
    // TODO: 1999-366 false
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
    // https://github.com/antvis/AVA/issues/156

    expect(isDateString('997815')).toBe(false);
    expect(isDateString('1135028')).toBe(false);
    expect(isDateString('5388715')).toBe(false);
  });
});
