import { toNumber, isNaN } from 'lodash';

const SPECIAL_BOOLEANS = [
  [true, false],
  [0, 1],
  ['true', 'false'],
  ['Yes', 'No'],
  ['True', 'False'],
  ['0', '1'],
  ['是', '否'],
];

const DELIMITER = '([-_./\\s])';
const YEAR = '(?<year>(18|19|20)\\d{2})';
const MONTH = '(?<month>0?[1-9]|1[012])';
const DAY = '(?<day>0?[1-9]|[12]\\d|3[01])';
const WEEK = '(?<week>[0-4]\\d|5[0-2])';
const WEEKDAY = '(?<weekday>[1-7])';
const BASE_HOUR = '(0?\\d|1\\d|2[0-4])';
const BASE_MINUTE = '(0?\\d|[012345]\\d)';
const HOUR = `(?<hour>${BASE_MINUTE})`;
const MINUTE = `(?<minute>${BASE_MINUTE})`;
const SECOND = `(?<second>${BASE_MINUTE})`;
const MILLISECOND = '(?<millisecond>\\d{1,4})';
const YEARDAY = '(?<yearDay>(([0-2]\\d|3[0-5])\\d)|36[0-6])';
const OFFSET = `(?<offset>Z|[+-]${BASE_HOUR}(:${BASE_MINUTE})?)`;

/*
 * Check whether the string is a date.
 */
export function isUndefined(val: unknown) {
  return val === undefined;
}

export function isNumberLike(val: unknown) {
  const numVal = toNumber(val);
  return !isNaN(numVal);
}

export function isNil(value: unknown) {
  return value === null || value === undefined || value === '' || Number.isNaN(value as number) || value === 'null';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  if (typeof value === 'number') return true;
  return false;
}

export function isNumberString(value: unknown): value is string {
  if (isString(value)) {
    let hasDot = false;
    let tempValue = value;
    if (/^[+-]/.test(tempValue)) {
      tempValue = tempValue.slice(1);
    }
    for (let i = 0; i < tempValue.length; i += 1) {
      const char = tempValue[i];
      if (char === '.') {
        if (hasDot === false) {
          hasDot = true;
        } else {
          return false;
        }
      }
      if (char !== '.' && !/[0-9]/.test(char)) {
        return false;
      }
    }
    return tempValue.trim() !== '';
  }
  return false;
}

export function isInteger(value: unknown): value is number {
  if (typeof value === 'number') return Number.isInteger(value);
  return false;
}

export function isIntegerString(value: unknown): value is string {
  if (isString(value) && isNumberString(value as string)) return !(value as string).includes('.');
  return false;
}

export function isFloat(value: unknown): value is number {
  if (typeof value === 'number') return !Number.isNaN(value) && !Number.isInteger(value);
  return false;
}

export function isFloatString(value: unknown): value is string {
  if (isString(value) && isNumberString(value as string)) return (value as string).includes('.');
  return false;
}

export function isDate(value: unknown): value is Date {
  if (value && Object.getPrototypeOf(value) === Date.prototype) return true;
  return false;
}

export function isBoolean(value: unknown, checkSpecialBoolean?: boolean) {
  return checkSpecialBoolean
    ? SPECIAL_BOOLEANS.some((list: unknown[]) => {
        return (value as unknown[]).every((item: unknown) => list.includes(item));
      })
    : typeof value === 'boolean';
}

export function isObject(value: unknown): value is object {
  return !!value && Object.getPrototypeOf(value) === Object.prototype;
}

export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

export function isBasicType(value: unknown) {
  return !isArray(value) && !isObject(value);
}

/**
 * Get ISO 8601 date regular expression string array
 * Reference: https://www.cl.cam.ac.uk/~mgk25/iso-time.html
 * @param strict Require delimiter or not
 */
export function getIsoDatePatterns(strict = true) {
  return [
    // 1991
    `${YEAR}`,
    // 1999-W12-7
    `${YEAR}${DELIMITER}${strict ? '' : '?'}W${WEEK}(${DELIMITER}${strict ? '' : '?'}${WEEKDAY})?`,
    // 12-22-1999
    `${MONTH}${DELIMITER}${strict ? '' : '?'}${DAY}${DELIMITER}${strict ? '' : '?'}${YEAR}`,
    // 1999-12-22 19991222
    `${YEAR}${DELIMITER}${strict ? '' : '?'}${MONTH}${DELIMITER}${strict ? '' : '?'}${DAY}`,
    // 1999-12
    `${YEAR}${DELIMITER}${strict ? '' : '?'}${MONTH}`,
    // 1999-200
    `${YEAR}${DELIMITER}${strict ? '' : '?'}${YEARDAY}`,
  ];
}

/**
 * Get ISO 8601 time regular expression string array
 * Reference: https://www.cl.cam.ac.uk/~mgk25/iso-time.html
 * @param strict Require DELIMITER or not
 */
export function getIsoTimePatterns(strict = true) {
  return [
    // 23:20:20Z 23:20:20+08:00 23:20:20-08:00
    `${HOUR}:${strict ? '' : '?'}${MINUTE}:${strict ? '' : '?'}${SECOND}([.,]${MILLISECOND})?${OFFSET}?`,
    // 23:20+08
    `${HOUR}:${strict ? '' : '?'}${MINUTE}?${OFFSET}`,
  ];
}

const getIsoDateAndTimeRegs = (strictDatePattern?: boolean): RegExp[] => {
  const isoDatePatterns = getIsoDatePatterns(strictDatePattern);
  const isoTimePatterns = getIsoTimePatterns(strictDatePattern);
  const isoDateAndTimePatterns = [...isoDatePatterns, ...isoTimePatterns];

  isoDatePatterns.forEach((d) => {
    isoTimePatterns.forEach((t) => {
      isoDateAndTimePatterns.push(`${d}[T\\s]${t}`);
    });
  });
  return isoDateAndTimePatterns.map((pattern) => {
    return new RegExp(`^${pattern}$`);
  });
};

export function isDateString(value: unknown, strictDatePattern?: boolean): value is string {
  if (isString(value)) {
    const isoDateAndTimeRegs = getIsoDateAndTimeRegs(strictDatePattern);
    for (let i = 0; i < isoDateAndTimeRegs.length; i += 1) {
      const reg = isoDateAndTimeRegs[i];
      if (reg.test(value.trim())) {
        return true;
      }
    }
  }
  return false;
}

/** parse ISO 8601 date string to standard Date type, if month and date is missing, will use new Date(01-01)
 * Reference: https://www.cl.cam.ac.uk/~mgk25/iso-time.html
 * 将日期字符串转为标准 Date 类型，如果没有月日，只有时间信息，会默认为 01-01
 */
export function parseIsoDateString(value: string, strictDatePattern: boolean = false): Date | null {
  const isoDateAndTimeRegs = getIsoDateAndTimeRegs(strictDatePattern);
  for (let i = 0; i < isoDateAndTimeRegs.length; i += 1) {
    const reg = isoDateAndTimeRegs[i];
    if (reg.test(value.trim())) {
      const matches = value.trim().match(reg);
      if (matches!.groups) {
        const { year, month, day, week, weekday, hour, minute, second, millisecond, yearDay, offset } =
          matches!.groups || {};
        const yearNum = parseInt(year, 10);
        if (yearDay) {
          return new Date(yearNum, 0, parseInt(yearDay, 10));
        }

        if (week) {
          const weekNum = parseInt(week, 10);
          const weekDayNum = weekday ? parseInt(weekday, 10) : 1;
          const firstDayOfYear = new Date(yearNum, 0, 1);
          // 给定年份的第一天是周几
          const firstDayOfYearDayOfWeek = firstDayOfYear.getDay() === 0 ? 7 : firstDayOfYear.getDay();
          // 计算第一周的第一天相对 firstDayOfYear 的偏移量
          const firstWeekStartDayOffset = firstDayOfYearDayOfWeek === 1 ? 1 : 1 - firstDayOfYearDayOfWeek;
          // 目标日期偏移量
          const targetDateOffset = (weekNum - 1) * 7 + (weekDayNum + firstWeekStartDayOffset);
          return new Date(yearNum, 0, targetDateOffset);
        }

        const formattedDateString = [year, month ?? '01', day ?? '01'].join('-');
        const formattedTimeString = `${[hour ?? '00', minute ?? '00', second ?? '00'].join(':')}.${
          millisecond ?? '000'
        }${offset ?? ''}`;
        return new Date(`${formattedDateString} ${formattedTimeString}`);
      }
    }
  }
  return null;
}
