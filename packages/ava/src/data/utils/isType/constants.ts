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
export const YEAR = '(18|19|20)\\d{2}';
export const MONTH = '(0?[1-9]|1[012])';
export const DAY = '(0?[1-9]|[12]\\d|3[01])';
export const WEEK = '([0-4]\\d|5[0-2])';
export const WEEKDAY = '([1-7])';
export const HOUR = '(0?\\d|1\\d|2[0-4])';
export const MINUTE = '(0?\\d|[012345]\\d)';
export const SECOND = MINUTE;
export const MILLISECOND = '\\d{1,4}';
export const YEARDAY = '((([0-2]\\d|3[0-5])\\d)|36[0-6])';
export const OFFSET = `(Z|[+-]${HOUR}(:${MINUTE})?)`;
