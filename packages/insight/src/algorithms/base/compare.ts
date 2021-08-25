export const ascending = (left: any, right: any) => {
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
  return left - right;
};

export const descending = (left: any, right: any) => {
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
  return right - left;
};
