const delimiter = '([-_./\\s])';
const year = '\\d{2,4}';
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
const iso_dates = [
  // 1999-W12-7
  // TODO: Date.parse do not parse this format
  `${year}${delimiter}?W${week}(${delimiter}?${weekday})?`,
  // 12-22-1999
  `${month}${delimiter}?${day}${delimiter}?${year}`,
  // 1999-12-22 19991222
  `${year}${delimiter}?${month}${delimiter}?${day}`,
  // 1999-12
  `${year}${delimiter}${month}`,
  // 1999-200
  `${year}${delimiter}?${yearday}`,
];

const iso_times = [
  // 23:20:20Z 23:20:20+08:00 23:20:20-08:00
  `${hour}:?${minute}:?${second}([.,]${millisecond})?${offset}?`,
  // 23:20+08
  `${hour}:?${minute}?${offset}`,
];

const formatstr = [...iso_dates, ...iso_times];

iso_dates.forEach((d) => {
  iso_times.forEach((t) => {
    formatstr.push(`${d}[T\\s]${t}`);
  });
});

const formats: RegExp[] = formatstr.map((item) => {
  return new RegExp(`^${item}$`);
});

export function isDateString(source: string): boolean {
  // let bl = false;
  for (const format of formats) {
    if (format.test(source.trim())) {
      // bl = !Number.isNaN(Date.parse(source));
      return true;
    }
  }
  return false;
}

export const intDatePartners = [
  /^(19|20)\d{2}$/,
  /^\d{4}(0?[1-9]|1[012])$/,
  /^\d{4}(0?[1-9]|1[012])(0?[1-9]|[12]\d|3[01])$/,
];
