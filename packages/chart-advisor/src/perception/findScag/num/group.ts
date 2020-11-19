import { each } from './defaultFunc';

// An internal function used for aggregate "group by" operations.
export default function group(behavior: (arg0: {}, arg1: any, arg2: any) => void, partition?: any) {
  return function(obj: any, iteratee: (arg0: any, arg1: string | number, arg2: any) => any) {
    const result = partition ? [[], []] : {};
    each(obj, function(value, index) {
      const key = iteratee(value, index, obj);
      behavior(result, value, key);
    });
    return result;
  };
}
