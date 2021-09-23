// TODO: better date validator, not regex solution. Whole column valid.
// examples:
// 1999-366 false, 2004-366 true;
// 199501,199502,199503,199519 -> 199519 19 as month -> false;

const delimiter = '([-_./\\s])';
const year = '(18|19|20)\\d{2}';
const month = '(0?[1-9]|1[012])';
const day = '(0?[1-9]|[12]\\d|3[01])';
const week = '([0-4]\\d|5[0-2])';
const weekday = '([1-7])';
const hour = '(0?\\d|1\\d|2[0-4])';
const minute = '(0?\\d|[012345]\\d)';
const second = minute;
const millisecond = '\\d{1,4}';
const yearday = '((([0-2]\\d|3[0-5])\\d)|36[0-6])';
const offset = `(Z|[+-]${hour}(:${minute})?)`;

// https://www.cl.cam.ac.uk/~mgk25/iso-time.html
export const getIsoDates = (isStrict = true) => [
  // 1991
  `${year}`,
  // 1999-W12-7
  // TODO: Date.parse do not parse this format
  `${year}${delimiter}${isStrict ? '' : '?'}W${week}(${delimiter}${isStrict ? '' : '?'}${weekday})?`,
  // 12-22-1999
  `${month}${delimiter}${isStrict ? '' : '?'}${day}${delimiter}${isStrict ? '' : '?'}${year}`,
  // 1999-12-22 19991222
  `${year}${delimiter}${isStrict ? '' : '?'}${month}${delimiter}${isStrict ? '' : '?'}${day}`,
  // 1999-12
  `${year}${delimiter}${isStrict ? '' : '?'}${month}`,
  // 1999-200
  `${year}${delimiter}${isStrict ? '' : '?'}${yearday}`,
];

export const getIsoTimes = (isStrict = true) => [
  // 23:20:20Z 23:20:20+08:00 23:20:20-08:00
  `${hour}:${isStrict ? '' : '?'}${minute}:${isStrict ? '' : '?'}${second}([.,]${millisecond})?${offset}?`,
  // 23:20+08
  `${hour}:${isStrict ? '' : '?'}${minute}?${offset}`,
];

const isoDatats = getIsoDates();
const isoTimes = getIsoTimes();
const formatstr = [...isoDatats, ...isoTimes];

isoDatats.forEach((d) => {
  isoTimes.forEach((t) => {
    formatstr.push(`${d}[T\\s]${t}`);
  });
});

const formats: RegExp[] = formatstr.map((item) => {
  return new RegExp(`^${item}$`);
});

export function isDateString(value: string): boolean {
  for (let i = 0; i < formats.length; i += 1) {
    const format = formats[i];
    if (format.test(value.trim())) {
      return true;
    }
  }
  return false;
}
