import { nativeIsArray } from './setup';
import { tagTester } from './_isFunction';

// Is a given value an array?
// Delegates to ECMA5's native `Array.isArray`.
export default nativeIsArray || tagTester('Array');
