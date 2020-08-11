import { root, toString } from './setup';

// Internal function for creating a `toString`-based type tester.
export function tagTester(name: string) {
  return function(obj: any) {
    return toString.call(obj) === '[object ' + name + ']';
  };
}

let isFunction = tagTester('Function');

// Optimize `isFunction` if appropriate. Work around some `typeof` bugs in old
// v8, IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
const nodelist = root.document && root.document.childNodes;
if (typeof /./ !== 'function' && typeof Int8Array !== 'object' && typeof nodelist !== 'function') {
  isFunction = function(obj) {
    return typeof obj === 'function' || false;
  };
}

export default isFunction;
