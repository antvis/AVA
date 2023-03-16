/**
 * Returns the maximum absolute value of array
 * @param x input array
 * */
export const maxabs = (x: number[]): number => {
  const absoluteX = x.map((value) => Math.abs(value));
  return Math.max(...absoluteX);
};
