/**
 * lodash sortby asc function
 * @param left unknown
 * @param right unknown
 * @returns number
 */
export function ascending(left: unknown, right: unknown) {
  const leftIsNull = left === null || left === undefined;
  const rightIsNull = right === null || right === undefined;
  if (leftIsNull && rightIsNull) {
    return 0;
  }
  if (leftIsNull) {
    return 1;
  }
  if (rightIsNull) {
    return -1;
  }
  return (left as number) - (right as number);
}

/**
 * lodash sortby desc function
 * @param left any
 * @param right any
 * @returns number
 */
export function descending(left: unknown, right: unknown) {
  const leftIsNull = left === null || left === undefined;
  const rightIsNull = right === null || right === undefined;
  if (leftIsNull && rightIsNull) {
    return 0;
  }
  if (leftIsNull) {
    return 1;
  }
  if (rightIsNull) {
    return -1;
  }
  return (right as number) - (left as number);
}
