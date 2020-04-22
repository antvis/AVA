import { standardDeviation, interquartileRange } from 'simple-statistics';

export function silverman(arr: number[]): number {
  const stdev = standardDeviation(arr);
  const num = 4 * Math.pow(stdev, 5);
  const denom = 3 * arr.length;
  return Math.pow(num / denom, 0.2);
}

export function nrd(arr: number[]): number {
  let s = standardDeviation(arr);
  const iqr = interquartileRange(arr);
  if (typeof iqr === 'number') {
    s = Math.min(s, iqr / 1.34);
  }
  return 1.06 * s * Math.pow(arr.length, -0.2);
}
