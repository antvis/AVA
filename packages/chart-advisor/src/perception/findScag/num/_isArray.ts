import { nativeIsArray } from './setup';
import { tagTester } from './_isFunction';

/**
 * Returns true if object is an Array.
 * @param object Check if this object is an Array.
 * @return True if `object` is an Array, otherwise false.
 **/
// Is a given value an array?
// Delegates to ECMA5's native `Array.isArray`.
export default nativeIsArray || tagTester('Array');
