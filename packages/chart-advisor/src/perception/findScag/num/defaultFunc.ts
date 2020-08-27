import isArrayLike from './_isArrayLike';
import keys from './keys';
import { hasOwnProperty, toString, slice } from './setup';

//Testing if the nodes are the same.
export function sameNodes(x: number[], y: number[]) {
  return x[0] === y[0] && x[1] === y[1];
}

// Some functions take a variable number of arguments, or a few expected
// arguments at the beginning and then a variable number of values to operate
// on. This helper accumulates all remaining arguments past the function’s
// argument length (or an explicit `startIndex`), into an array that becomes
// the last argument. Similar to ES6’s "rest parameter".
export function restArguments(func: any, startIndex?: number) {
  if (startIndex === undefined || startIndex === null) startIndex = func.length - 1;
  else startIndex = +startIndex;

  return function(this: any) {
    const length = Math.max(func.length - startIndex!, 0),
      rest = Array(length);
    let index = 0;

    for (; index < length; index++) {
      rest[index] = func[index + startIndex!];
    }

    switch (startIndex) {
      case 0:
        return func.call(this, rest);
      case 1:
        return func.call(this, func[0], rest);
      case 2:
        return func.call(this, func[0], func[1], rest);
    }

    const args = Array(startIndex! + 1);
    for (index = 0; index < startIndex!; index++) {
      args[index] = func[index];
    }

    args[startIndex!] = rest;
    return func.apply(this, args);
  };
}

// export function restArguments(func: any, startIndex?: number) {
//   if (startIndex === undefined || startIndex === null)
//     startIndex = func.length - 1;
//   else
//     startIndex = +startIndex;
//   return function (this: any) {
//     const length = Math.max(func.length - startIndex!, 0),
//       rest = Array(length);
//     let index = 0;
//     for (; index < length; index++) {
//       rest[index] = func[index + startIndex!];
//     }
//     switch (startIndex) {
//       case 0:
//         return func.call(this, rest);
//       case 1:
//         return func.call(this, func[0], rest);
//       case 2:
//         return func.call(this, func[0], func[1], rest);
//     }
//     const args = Array(startIndex! + 1);
//     for (index = 0; index < startIndex!; index++) {
//       args[index] = func[index];
//     }
//     args[startIndex!] = rest;
//     return func.apply(this, args);
//   };
// }

/**
 * Returns everything but the last entry of the array. Especially useful on the arguments object.
 * Pass n to exclude the last n elements from the result.
 * @param array Retreive all elements except the last `n`.
 * @param n Leaves this many elements behind, optional.
 * @return Returns everything but the last `n` elements of `array`.
 **/
// Returns everything but the last entry of the array. Especially useful on
// the arguments object. Passing **n** will return all the values in
// the array, excluding the last N.
export function initial(array: string | any[], n: any, guard?: any) {
  return slice.call(array, 0, Math.max(0, array.length - (n === null || guard ? 1 : n)));
}

/**
 * Returns the first element of an array. Passing n will return the first n elements of the array.
 * @param array Retreives the first `n` elements of this array.
 * @param n Return more than one element from `array`.
 * @return Returns the first `n` elements from `array.
 **/
// Get the first element of an array. Passing **n** will return the first N
// values in the array. The **guard** check allows it to work with `_.map`.
export function first(array: string | any[] | null, n?: number | null, guard?: any) {
  if (typeof n === 'undefined') n = null;

  if (array === null || array.length < 1) return n === null || guard ? void 0 : [];

  if (n === null || guard) return array[0];

  return initial(array, array.length - n);
}

/**
 * Return all of the values of the object's properties.
 * @param object Retreive the values of all the properties on this object.
 * @return List of all the values on `object`.
 **/
// Retrieve the values of an object's properties.
export function values(obj: any) {
  const _keys = keys(obj);
  const length = _keys.length;
  const values = Array(length);

  for (let i = 0; i < length; i++) {
    values[i] = obj[_keys[i]];
  }

  return values;
}

/**
 * Returns true if the value is present in the list. Uses indexOf internally,
 * if list is an Array.
 * @param list Checks each element to see if `value` is present.
 * @param value The value to check for within `list`.
 * @return True if `value` is present in `list`, otherwise false.
 **/
// Determine if the array or object contains a given item (using `===`).
export function contains(obj: any[], item: any, fromIndex?: number, guard?: any) {
  if (!isArrayLike(obj)) obj = values(obj);

  if (typeof fromIndex !== 'number' || guard) fromIndex = 0;

  return obj.indexOf(item, fromIndex) >= 0;
}

/**
 * Returns true if object is either true or false.
 * @param object Check if this object is a bool.
 * @return True if `object` is a bool, otherwise false.
 **/
// Is a given value a boolean?
export function isBoolean(obj: boolean) {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
}

/**
 * Does the object contain the given key? Identical to object.hasOwnProperty(key), but uses a safe
 * reference to the hasOwnProperty function, in case it's been overridden accidentally.
 * @param object Object to check for `key`.
 * @param key The key to check for on `object`.
 * @return True if `key` is a property on `object`, otherwise false.
 **/
// Internal function to check whether `key` is an own property name of `obj`.
export function has(obj: null, key: string | number | symbol) {
  return obj !== null && hasOwnProperty.call(obj, key);
}

// Internal function that returns an efficient (for current engines) version
// of the passed-in callback, to be repeatedly applied in other Underscore
// functions.
export function optimizeCb(func: any, context: any, argCount?: any) {
  if (context === void 0) return func;

  switch (argCount === null ? 3 : argCount) {
    case 1:
      return function(value: any) {
        return func.call(context, value);
      };
    // The 2-argument case is omitted because we’re not using it.
    case 3:
      return function(value: any, index: any, collection: any) {
        return func.call(context, value, index, collection);
      };
    case 4:
      return function(accumulator: any, value: any, index: any, collection: any) {
        return func.call(context, accumulator, value, index, collection);
      };
  }

  return function() {
    return func.apply(context);
  };
}

/**
 * Iterates over a list of elements, yielding each in turn to an iterator function. The iterator is
 * bound to the context object, if one is passed. Each invocation of iterator is called with three
 * arguments: (element, index, list). If list is a JavaScript object, iterator's arguments will be
 * (value, key, object). Delegates to the native forEach function if it exists.
 * @param list Iterates over this list of elements.
 * @param iterator Iterator function for each element `list`.
 * @param context 'this' object in `iterator`, optional.
 **/
// The cornerstone for collection functions, an `each`
// implementation, aka `forEach`.
// Handles raw objects in addition to array-likes. Treats all
// sparse array-likes as if they were dense.
export function each(obj: any, iteratee: (arg0: any, arg1: string | number, arg2: any) => void, context?: any) {
  iteratee = optimizeCb(iteratee, context);
  let i, length;

  if (isArrayLike(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      iteratee(obj[i], i, obj);
    }
  } else {
    const _keys = keys(obj);
    for (i = 0, length = _keys.length; i < length; i++) {
      iteratee(obj[_keys[i]], _keys[i], obj);
    }
  }

  return obj;
}

/**
 * Looks through each value in the list, returning an array of all the values that pass a truth
 * test (iterator). Delegates to the native filter method, if it exists.
 * @param list Filter elements out of this list.
 * @param iterator Filter iterator function for each element in `list`.
 * @param context `this` object in `iterator`, optional.
 * @return The filtered list of elements.
 **/
// Return all the elements that pass a truth test.
export function filter(obj: any, predicate: (arg0: any, arg1: string | number, arg2: any) => any) {
  const results: any = [];

  each(obj, function(value, index, list) {
    if (predicate(value, index, list)) results.push(value);
  });

  return results;
}
