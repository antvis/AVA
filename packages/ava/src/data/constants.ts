export const SPECIAL_BOOLEANS = [
  [true, false],
  [0, 1],
  ['true', 'false'],
  ['Yes', 'No'],
  ['True', 'False'],
  ['0', '1'],
  ['是', '否'],
];

// For isDateString.ts
export const DELIMITER = '([-_./\\s])';
export const YEAR = '(?<year>(18|19|20)\\d{2})';
export const MONTH = '(?<month>0?[1-9]|1[012])';
export const DAY = '(?<day>0?[1-9]|[12]\\d|3[01])';
export const WEEK = '(?<week>[0-4]\\d|5[0-2])';
export const WEEKDAY = '(?<weekday>[1-7])';
export const BASE_HOUR = '(0?\\d|1\\d|2[0-4])';
export const BASE_MINUTE = '(0?\\d|[012345]\\d)';
export const HOUR = `(?<hour>${BASE_MINUTE})`;
export const MINUTE = `(?<minute>${BASE_MINUTE})`;
export const SECOND = `(?<second>${BASE_MINUTE})`;
export const MILLISECOND = '(?<millisecond>\\d{1,4})';
export const YEARDAY = '(?<yearDay>(([0-2]\\d|3[0-5])\\d)|36[0-6])';
export const OFFSET = `(?<offset>Z|[+-]${BASE_HOUR}(:${BASE_MINUTE})?)`;
