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

const isoDatePatterns = getIsoDatePatterns();
const isoTimePatterns = getIsoTimePatterns();
const isoDateAndTimePatterns = [...isoDatePatterns, ...isoTimePatterns];

isoDatePatterns.forEach((d) => {
  isoTimePatterns.forEach((t) => {
    isoDateAndTimePatterns.push(`${d}[T\\s]${t}`);
  });
});

const isoDateAndTimeRegs: RegExp[] = isoDateAndTimePatterns.map((pattern) => {
  return new RegExp(`^${pattern}$`);
});

export function isDateString(value: string): boolean {
  for (let i = 0; i < isoDateAndTimeRegs.length; i += 1) {
    const reg = isoDateAndTimeRegs[i];
    if (reg.test(value.trim())) {
      return true;
    }
  }
  return false;
}
