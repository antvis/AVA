/**
 * Check if two arrays are equal ignoring the orders.
 *
 * @param arr1
 * @param arr2
 */
export function arrayEqualIgnoreOrder(arr1: any[], arr2: any[]): boolean {
  return (
    Array.isArray(arr1) &&
    Array.isArray(arr2) &&
    arr1.length === arr2.length &&
    arr1.every((val, idx) => val === arr2[idx])
  );
}

/**
 * Check if something is a JS object (not Object).
 *
 * @param value
 */
export function isObjectDataStructure(value: any): boolean {
  return value.constructor === {}.constructor;
}

/**
 * Check input is empty-like: null, undefined, '', NaN, [], {}
 */
export function isEmptyLike(value: any): boolean {
  return (
    !value ||
    (Array.isArray(value) && !value.length) ||
    (value.constructor === Object && Object.keys(value).length === 0)
  );
}

/**
 * Rename a key of object.
 */
export function renameKey(object: any, oldKey: string, newKey: string): void {
  delete Object.assign(object, { [newKey]: object[oldKey] })[oldKey];
}
