import { Datum } from '../interface';

// join func, ['A', 'B', 'C'] => 'A, B and C'
export const join = (items: (string | number)[]) => {
  const size = items.length;
  if (size === 1) {
    return items[0];
  }
  const notLastPart = items.slice(0, -1).join(', ');
  return `${notLastPart} and ${items[size - 1]}`;
};

// datum position string. { A: 'a', B: 1 } => '(a, 1)'
export const getDatumPositionString = (datum: Datum, dimension: string, measure: string) => {
  return `(${datum[dimension]}, ${datum[measure]})`;
};

// data format.
// dataFormat(12, 1) = 12
// dataFormat(1234, 1) = 1.2k
// dataFormat(123.456, 2) = 123.46
export const dataFormat = (value: number | string, digits: number = 2) => {
  if(typeof value === 'string') return value;

  const formatMap = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = formatMap.slice().reverse().find(function(item) {
    return value >= item.value;
  });
  return item ? (value / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
};
