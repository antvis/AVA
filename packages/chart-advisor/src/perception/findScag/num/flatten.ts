import getLength from './_getLength';
import isArrayLike from './_isArrayLike';
import isArray from './_isArray';
import isArguments from './_isArguments';

/**
 * Flattens a nested array (the nesting can be to any depth). If you pass shallow, the array will
 * only be flattened a single level.
 * @param array The array to flatten.
 * @param shallow If true then only flatten one level, optional, default = false.
 * @return `array` flattened.
 **/
// Internal implementation of a recursive `flatten` function.
export default function flatten(input: any, depth: any, strict: any, output?: any[]) {
  output = output || [];
  if (!depth && depth !== 0) {
    depth = Infinity;
  } else if (depth <= 0) {
    return output.concat(input);
  }
  let idx = output.length;
  for (let i = 0, length = getLength(input); i < length; i++) {
    const value = input[i];
    if (isArrayLike(value) && (isArray(value) || isArguments(value))) {
      // Flatten current level of array or arguments object.
      if (depth > 1) {
        flatten(value, depth - 1, strict, output);
        idx = output.length;
      } else {
        let j = 0;
        const len = value.length;
        while (j < len) output[idx++] = value[j++];
      }
    } else if (!strict) {
      output[idx++] = value;
    }
  }
  return output;
}
