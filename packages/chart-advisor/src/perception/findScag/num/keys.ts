import { nativeKeys, hasEnumBug, nonEnumerableProps, ObjProto } from './setup';
import { has } from './defaultFunc';
import isFunction from './_isFunction';

// Internal helper to create a simple lookup structure.
// `collectNonEnumProps` used to depend on `_.contains`, but this led to
// circular imports. `emulatedSet` is a one-off solution that only works for
// arrays of strings.
function emulatedSet(keys: any[]) {
  const hash: any = {};
  for (let l = keys.length, i = 0; i < l; ++i) hash[keys[i]] = true;
  return {
    contains: function(key: any) {
      return hash[key];
    },
    push: function(key: any) {
      hash[key] = true;
      return keys.push(key);
    },
  };
}

// Internal helper. Checks `keys` for the presence of keys in IE < 9 that won't
// be iterated by `for key in ...` and thus missed. Extends `keys` in place if
// needed.
export function collectNonEnumProps(obj: any, keys: any) {
  keys = emulatedSet(keys);
  let nonEnumIdx = nonEnumerableProps.length;
  const constructor = obj.constructor;
  const proto = (isFunction(constructor) && constructor.prototype) || ObjProto;

  // Constructor is a special case.
  let prop = 'constructor';
  if (has(obj, prop) && !keys.contains(prop)) keys.push(prop);

  while (nonEnumIdx--) {
    prop = nonEnumerableProps[nonEnumIdx];
    if (prop in obj && obj[prop] !== proto[prop] && !keys.contains(prop)) {
      keys.push(prop);
    }
  }
}

// Is a given variable an object?
export function isObject(obj: any) {
  const type = typeof obj;
  return type === 'function' || (type === 'object' && !!obj);
}

// Retrieve the names of an object's own properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`.
export default function keys(obj: any) {
  if (!isObject(obj)) return [];
  if (nativeKeys) return nativeKeys(obj);
  const keys = [];
  for (const key in obj) if (has(obj, key)) keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
}
