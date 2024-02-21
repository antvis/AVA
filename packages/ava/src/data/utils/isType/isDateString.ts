/*
 * Check whether the string is a date.
 */

import {
  DAY,
  DELIMITER,
  HOUR,
  MILLISECOND,
  MINUTE,
  MONTH,
  OFFSET,
  SECOND,
  WEEK,
  WEEKDAY,
  YEAR,
  YEARDAY,
} from './constants';
import { isString } from './isType';

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
      if (matches.groups) {
        const { year, month, day, week, weekday, hour, minute, second, millisecond, yearDay, offset } =
          matches.groups || {};
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
