import { restArguments, contains, filter } from './defaultFunc';
import flatten from './flatten';

// Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.
export default restArguments(function(array: any, rest: any[]) {
  rest = flatten(rest, true, true);
  return filter(array, function(value: any) {
    return !contains(rest, value);
  });
});
