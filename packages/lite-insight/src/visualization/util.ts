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
