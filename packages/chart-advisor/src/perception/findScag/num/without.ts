import { restArguments, contains, filter } from './defaultFunc';
import { _difference } from './difference';

/**
 * Returns a copy of the array with all instances of the values removed.
 * @param array The array to remove `values` from.
 * @param values The values to remove from `array`.
 * @return Copy of `array` without `values`.
 **/
// Filter the difference between one array and a number of other arrays.
export function without(array: any, otherArrays: any) {
  return _difference(array, otherArrays);
}

// Filter the difference between one array and a number of other arrays.
export function _without(array: any, otherArrays: any[]) {
  return restArguments(without(array, otherArrays))();
}

// Return a version of the array that does not contain the specified value(s).
export default restArguments((narray: any, otherArrays: any) => {
  return restArguments((array = narray, rest = otherArrays) => {
    return filter(array, function(value: any) {
      return !contains(rest, value);
    });
  })();
});
