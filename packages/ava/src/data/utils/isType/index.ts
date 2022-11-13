/**
 * Return the flattened result of the array.
 * @param array - The array to process
 */
export function flatten(array: any[]) {
  let res = [];
  for (let i = 0; i < array.length; i += 1) {
    if (isArray(array[i])) {
      res = res.concat(flatten(array[i]));
    } else {
      res.push(array[i]);
    }
  }
  return res;
}
