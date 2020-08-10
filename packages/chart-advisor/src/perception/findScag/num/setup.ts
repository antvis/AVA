// Establish the root object, `window` (`self`) in the browser, `global`
// on the server, or `this` in some virtual machines. We use `self`
// instead of `window` for `WebWorker` support.
export const root =
  (typeof self == 'object' && self.self === self && self) ||
  (typeof global == 'object' && global.global === global && global) ||
  Function('return this')() ||
  {};

// Save bytes in the minified (but not gzipped) version:
export const ArrayProto = Array.prototype,
  ObjProto = Object.prototype;
export const SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

// Create quick reference constiables for speed access to core prototypes.
export const push = ArrayProto.push,
  slice = ArrayProto.slice,
  toString = ObjProto.toString,
  hasOwnProperty = ObjProto.hasOwnProperty;

// Modern feature detection.
export const supportsArrayBuffer = typeof ArrayBuffer !== 'undefined';

// All **ECMAScript 5+** native function implementations that we hope to use
// are declared here.
export const nativeIsArray = Array.isArray,
  nativeKeys = Object.keys,
  nativeCreate = Object.create,
  nativeIsView = supportsArrayBuffer && ArrayBuffer.isView;

// Create references to these builtin functions because we override them.
export const _isNaN = isNaN,
  _isFinite = isFinite;

// Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
export const hasEnumBug = !{}.propertyIsEnumerable.call(toString, 'toString');
export const nonEnumerableProps = [
  'valueOf',
  'isPrototypeOf',
  'toString',
  'propertyIsEnumerable',
  'hasOwnProperty',
  'toLocaleString',
];

// The largest integer that can be represented exactly.
export const MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
