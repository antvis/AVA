import { toNumber, isNaN } from 'lodash';

export function isNumberLike(val: unknown) {
  const numVal = toNumber(val);
  return !isNaN(numVal);
}
