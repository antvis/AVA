import { restArguments } from './defaultFunc';
import difference from './difference';

// Return a version of the array that does not contain the specified value(s).
export default restArguments(function(array: any, otherArrays: any) {
  return difference(array, otherArrays);
});
