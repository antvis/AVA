import { restArguments, contains, filter } from './defaultFunc';
import flatten from './flatten';

/**
 * Similar to without, but returns the values from array that are not present in the other arrays.
 * @param array Keeps values that are within `others`.
 * @param others The values to keep within `array`.
 * @return Copy of `array` with only `others` values.
 **/
// Search the difference between one array and a number of other arrays.
export function difference(array: any, rest: any[]) {
  rest = flatten(rest, true, true);
  return filter(array, function(value: any) {
    return !contains(rest, value);
  });
}

// Search the difference between one array and a number of other arrays.
export function _difference(array: any, rest: any[]) {
  return restArguments(difference(array, rest))();
}

// Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.
export default restArguments((array: any, rest: any[]) => {
  rest = flatten(rest, true, true);
  return filter(array, function(value: any) {
    return !contains(rest, value);
  });
});
