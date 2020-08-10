import { contains } from './defaultFunc';
import getLength from './_getLength';

// Produce a duplicate-free version of the array. If the array has already
// been sorted, you have the option of using a faster algorithm.
// The faster algorithm will not work with an iteratee if the iteratee
// is not a one-to-one function, so providing an iteratee will disable
// the faster algorithm.
export default function uniq(array: { [x: string]: any }, iteratee?: any) {
  let isSorted = false;
  const result = [];
  let seen = [];
  for (let i = 0, length = getLength(array); i < length; i++) {
    const value = array[i],
      computed = iteratee ? iteratee(value, i, array) : value;
    if (isSorted && !iteratee) {
      if (!i || seen !== computed) result.push(value);
      seen = computed;
    } else if (iteratee) {
      if (!contains(seen, computed)) {
        seen.push(computed);
        result.push(value);
      }
    } else if (!contains(result, value)) {
      result.push(value);
    }
  }
  return result;
}
