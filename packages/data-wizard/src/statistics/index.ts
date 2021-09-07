import { assert } from '../utils';
import * as cache from './caches';

/**
 * Return the maximum of the array
 * @param array - The array to process
 * @public
 */
export function min(array: number[]): number {
  const value = cache.get<number>(array, 'min');
  if (value !== undefined) {
    return value;
  }
  return cache.set(array, 'min', Math.min(...array));
}

/**
 * Return the minimum of the array
 * @param array - The array to process
 * @public
 */
export function max(array: number[]): number {
  const value = cache.get<number>(array, 'max');
  if (value !== undefined) return value;
  return cache.set(array, 'max', Math.max(...array));
}

function minIdx(array: number[]) {
  let min = array[0];
  let idx = 0;
  for (let i = 0; i < array.length; i += 1) {
    if (array[i] < min) {
      idx = i;
      min = array[i];
    }
  }
  return idx;
}

/**
 * Return the minimum index of the array
 * @param array - The array to process
 * @public
 */
export function minIndex(array: number[]): number {
  const value = cache.get<number>(array, 'minIndex');
  if (value !== undefined) return value;
  return cache.set(array, 'minIndex', minIdx(array));
}

function maxIdx(array: number[]) {
  let max = array[0];
  let idx = 0;
  for (let i = 0; i < array.length; i += 1) {
    if (array[i] > max) {
      idx = i;
      max = array[i];
    }
  }
  return idx;
}

/**
 * Return the maximum index of the array
 * @param array - The array to process
 * @public
 */
export function maxIndex(array: number[]): number {
  const value = cache.get<number>(array, 'maxIndex');
  if (value !== undefined) return value;
  return cache.set(array, 'maxIndex', maxIdx(array));
}

/**
 * Return the sum of the array
 * @param array - The array to process
 * @public
 */
export function sum(array: number[]): number {
  const value = cache.get<number>(array, 'sum');
  if (value !== undefined) return value;
  return cache.set(
    array,
    'sum',
    array.reduce((prev, current) => current + prev, 0)
  );
}

/**
 * Return the counts of valid value in the array
 * @param array - The array to process
 * @public
 */
export function valid(array: any[]): number {
  let count = 0;
  for (let i = 0; i < array.length; i += 1) {
    if (array[i]) count += 1;
  }
  return count;
}

/**
 * Return the counts of missing value in the array
 * @param array - The array to process
 * @public
 */
export function missing(array: any[]): number {
  return array.length - valid(array);
}

/**
 * Return the counts of each distinct value in the array
 * @param array - The array to process
 * @public
 */
export function valueMap(array: any[]): Record<string, number> {
  const data: Record<string, number> = {};
  array.forEach((value) => {
    if (data[value]) data[value] += 1;
    else data[value] = 1;
  });
  return data;
}

/**
 * Return the counts of distinct value in the array
 * @param array - The array to process
 * @public
 */
export function distinct(array: any[]): number {
  return Object.keys(valueMap(array)).length;
}

function sort(array: number[]): number[] {
  return array.sort((l, r) => (l > r ? 1 : -1));
}

/**
 * Return the median of the array
 * @param array - The array to process
 * @public
 */
export function median(array: number[], ordered = false): number {
  const { length } = array;
  const newArray = ordered ? array : sort(array);
  if (length % 2 === 1) return newArray[(length - 1) / 2];
  return (newArray[length / 2 - 1] + newArray[length / 2]) / 2;
}

/**
 * Return the quartile of the array
 * @param array - The array to process
 * @param ordered - Whether it is ordered
 * @public
 */
export function quartile(array: number[], ordered = false): [number, number, number] {
  assert(array.length >= 3, 'array.length cannot be less than 3');

  const { length } = array;
  const newArray = ordered ? array : sort(array);
  const Q2 = median(newArray, true);
  let Q1: number;
  let Q3: number;
  if (length % 2 === 1) {
    Q1 = median(newArray.slice(0, (length - 1) / 2), true);
    Q3 = median(newArray.slice((length + 1) / 2), true);
  } else {
    Q1 = median(newArray.slice(0, length / 2), true);
    Q3 = median(newArray.slice(length / 2), true);
  }

  return [Q1, Q2, Q3];
}

/**
 * Return the quantile of the array
 * @param array - The array to process
 * @param percent - percent
 * @param ordered - Whether it is ordered
 * @public
 */
export function quantile(array: number[], percent: number, ordered = false): number {
  assert(percent > 0 && percent < 100, 'percent cannot be between (0, 100)');

  const newArray = ordered ? array : sort(array);
  const index = Math.ceil((array.length * percent) / 100) - 1;
  return newArray[index];
}

/**
 * Return the mean of the array
 * @param array - The array to process
 * @public
 */
export function mean(array: number[]): number {
  return sum(array) / array.length;
}

/**
 * Return the geometricMean of the array
 * @param array - The array to process
 * @public
 */
export function geometricMean(array: number[]): number {
  assert(array.some((item) => item > 0), 'each item in array must greater than 0');

  const value = cache.get<number>(array, 'geometricMean');
  if (value !== undefined) return value;
  return cache.set(array, 'geometricMean', array.reduce((prev, curr) => prev * curr, 1) ** (1 / array.length));


}

/**
 * Return the harmonicMean of the array
 * @param array - The array to process
 * @public
 */
export function harmonicMean(array: number[]): number {
  const base = 2 ** 16;
  const value = cache.get<number>(array, 'harmonicMean');
  if (value !== undefined) return value;
  return cache.set(
    array,
    'harmonicMean',
    (base * array.length) / array.reduce((prev, curr) => base / curr + prev, 0)
  );
}

/**
 * Return the variance of the array
 * @param array - The array to process
 *
 * @public
 */
export function variance(array: number[]): number {
  const m = mean(array);
  const value = cache.get<number>(array, 'variance');
  if (value !== undefined) return value;
  return cache.set(array, 'variance', array.reduce((prev, curr) => prev + (curr - m) ** 2, 0) / array.length);
}

/**
 * Return the standard deviation of the array
 * @param array - The array to process
 * @public
 */
export function stdev(array: number[]): number {
  return Math.sqrt(variance(array));
}

/**
 * Return the covariance of the array
 * @param array - The array to process
 * @public
 */

export function covariance(x: number[], y: number[]): number {
  assert(x.length === y.length, 'x and y must has same length');

  const exy = mean(x.map((item, i) => item * y[i]));
  return exy - mean(x) * mean(y);
}

/**
 * Return the Pearson CorrelationCoefficient of two array
 * @public
 */
export function pearson(x: number[], y: number[]): number {
  const cov = covariance(x, y);
  const dx = stdev(x);
  const dy = stdev(y);
  return cov / (dx * dy);
}
