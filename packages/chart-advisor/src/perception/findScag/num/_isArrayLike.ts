import getLength from './_getLength';
import { MAX_ARRAY_INDEX } from './setup';

// Common internal logic for `isArrayLike` and `isBufferLike`.
export function createSizePropertyCheck(getSizeProperty: (arg0: any) => any) {
  return function(collection: any) {
    const sizeProperty = getSizeProperty(collection);
    return typeof sizeProperty === 'number' && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
  };
}

// Internal helper for collection methods to determine whether a collection
// should be iterated as an array or as an object.
// Related: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
// Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
export default createSizePropertyCheck(getLength);
