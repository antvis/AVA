/**
 * data format.
 * dataFormat(0.8849) = 0.88
 * dataFormat(12, 1) = 12
 * dataFormat(1234, 1) = 1.2k
 * dataFormat(123.456, 2) = 123.46
 * @param value value to be formatted
 * @param digits the number of digits to keep after the decimal point, 2 by default
 * @returns formatted value string
 */
export default function dataFormat(value: number | string, digits: number = 2) {
  if (typeof value === 'string') return value;

  const formatMap = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = formatMap
    .slice()
    .reverse()
    .find((item) => {
      return value >= item.value;
    });
  return item ? (value / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : value.toFixed(digits);
}
