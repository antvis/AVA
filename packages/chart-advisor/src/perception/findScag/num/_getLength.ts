import { hasOwnProperty } from './setup';

// Internal helper to generate a function to obtain property `key` from `obj`.
export function shallowProperty(key: string | number) {
  return function(obj: any) {
    let mus = obj;
    if (typeof mus === 'undefined') mus = null;
    return mus === null ? void 0 : obj[key];
  };
}

// Internal function to obtain a nested property in `obj` along `path`.
export function deepGet(obj: { [x: string]: any } | null, path: string | any[]) {
  const length = path.length;

  for (let i = 0; i < length; i++) {
    if (obj === null) return void 0;
    obj = obj[path[i]];
  }

  return length ? obj : void 0;
}

// Is a given variable an object?
export function isObject(obj: any) {
  const type = typeof obj;
  return type === 'function' || (type === 'object' && !!obj);
}

// Internal function to check whether `key` is an own property name of `obj`.
export function has(obj: { [x: string]: any } | null, key: string | number | symbol) {
  return obj !== null && hasOwnProperty.call(obj, key);
}

export default shallowProperty('length');
