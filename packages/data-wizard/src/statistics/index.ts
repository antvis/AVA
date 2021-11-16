import { assert, isArray, flatten } from '../utils';
import * as cache from './caches';

/**
 * Return the minimum of the array.
 * @param array - The array to process
 */
export function min(array: number[]): number {
  const value = cache.get<number>(array, 'min');
  if (value !== undefined) {
    return value;
  }
  return cache.set(array, 'min', Math.min(...array));
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
 * Return the minimum index of the array.
 * @param array - The array to process
 */
export function minIndex(array: number[]): number {
  const value = cache.get<number>(array, 'minIndex');
  if (value !== undefined) return value;
  return cache.set(array, 'minIndex', minIdx(array));
}

/**
 * Return the maximum of the array.
 * @param array - The array to process
 */
export function max(array: number[]): number {
  const value = cache.get<number>(array, 'max');
  if (value !== undefined) return value;
  return cache.set(array, 'max', Math.max(...array));
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
 * Return the maximum index of the array.
 * @param array - The array to process
 */
export function maxIndex(array: number[]): number {
  const value = cache.get<number>(array, 'maxIndex');
  if (value !== undefined) return value;
  return cache.set(array, 'maxIndex', maxIdx(array));
}

/**
 * Return the sum of the array.
 * @param array - The array to process
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
 * Return the mean of the array.
 * @param array - The array to process

 */
export function mean(array: number[]): number {
  return sum(array) / array.length;
}

/**
 * Return the geometricMean of the array.
 * @param array - The array to process
 */
export function geometricMean(array: number[]): number {
  assert(
    array.some((item) => item > 0),
    'each item in array must greater than 0'
  );

  const value = cache.get<number>(array, 'geometricMean');
  if (value !== undefined) return value;
  return cache.set(array, 'geometricMean', array.reduce((prev, curr) => prev * curr, 1) ** (1 / array.length));
}

/**
 * Return the harmonicMean of the array.
 * @param array - The array to process
 */
export function harmonicMean(array: number[]): number {
  const base = 2 ** 16;
  const value = cache.get<number>(array, 'harmonicMean');
  if (value !== undefined) return value;
  return cache.set(array, 'harmonicMean', (base * array.length) / array.reduce((prev, curr) => base / curr + prev, 0));
}

function sort(array: number[]): number[] {
  return array.sort((l, r) => (l > r ? 1 : -1));
}

/**
 * Return the median of the array.
 * @param array - The array to process
 */
export function median(array: number[], sorted = false): number {
  const { length } = array;
  const newArray = sorted ? array : sort(array);
  if (length % 2 === 1) return newArray[(length - 1) / 2];
  return (newArray[length / 2 - 1] + newArray[length / 2]) / 2;
}

/**
 * Return the quartile of the array.
 * @param array - The array to process
 * @param sorted - Whether it is sorted
 */
export function quartile(array: number[], sorted = false): [number, number, number] {
  assert(array.length >= 3, 'array.length cannot be less than 3');

  const { length } = array;
  const newArray = sorted ? array : sort(array);
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
 * Return the quantile of the array.
 * @param array - The array to process
 * @param percent - percent
 * @param sorted - Whether it is sorted
 */
export function quantile(array: number[], percent: number, sorted = false): number {
  assert(percent > 0 && percent < 100, 'percent cannot be between (0, 100)');

  const newArray = sorted ? array : sort(array);
  const index = Math.ceil((array.length * percent) / 100) - 1;
  return newArray[index];
}

/**
 * Return the variance of the array.
 * @param array - The array to process
 */
export function variance(array: number[]): number {
  const m = mean(array);
  const value = cache.get<number>(array, 'variance');
  if (value !== undefined) return value;
  return cache.set(array, 'variance', array.reduce((prev, curr) => prev + (curr - m) ** 2, 0) / array.length);
}

/**
 * Return the standard deviation of the array.
 * @param array - The array to process
 */
export function standardDeviation(array: number[]): number {
  return Math.sqrt(variance(array));
}

/**
 * Return the coefficient of variance of the array.
 * @param array - The array to process
 */
export function coefficientOfVariance(array: number[]): number {
  const stdev = standardDeviation(array);
  const arrayMean = mean(array);
  return stdev / arrayMean;
}

/**
 * Return the covariance of the array.
 * @param array - The array to process
 */

export function covariance(x: number[], y: number[]): number {
  assert(x.length === y.length, 'x and y must has same length');

  const exy = mean(x.map((item, i) => item * y[i]));
  return exy - mean(x) * mean(y);
}

/**
 * Return the Pearson CorrelationCoefficient of two array.
 */
export function pearson(x: number[], y: number[]): number {
  const cov = covariance(x, y);
  const dx = standardDeviation(x);
  const dy = standardDeviation(y);
  return cov / (dx * dy);
}

/**
 * Return the counts of valid value in the array.
 * @param array - The array to process
 */
export function valid(array: any[]): number {
  let count = 0;
  for (let i = 0; i < array.length; i += 1) {
    if (array[i]) count += 1;
  }
  return count;
}

/**
 * Return the counts of missing value in the array.
 * @param array - The array to process
 */
export function missing(array: any[]): number {
  return array.length - valid(array);
}

/**
 * Return the counts of each distinct value in the array.
 * @param array - The array to process
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
 * Return the counts of distinct value in the array.
 * @param array - The array to process
 */
export function distinct(array: any[]): number {
  return Object.keys(valueMap(array)).length;
}

/**
 * Return the sum of the array by specific measure.
 * @param array - The array to process
 * @param measure - The selected measure
 */
export function sumBy(array: any[], measure: string) {
  return array.map((val) => val[measure]).reduce((acc, val) => acc + val, 0);
}

/**
 * Return the count of the array by specific measure.
 * @param array - The array to process
 * @param measure - The selected measure
 */
export function countBy(array: any[], measure: string) {
  return array.filter((item) => measure in item).length;
}

/**
 * Return the maximum of the array by specific measure.
 * @param array - The array to process
 * @param measure - The selected measure
 */
export function maxBy(array: any[], measure: string) {
  return Math.max(...array.map((val) => val[measure]));
}

/**
 * Return the minimum of the array by specific measure.
 * @param array - The array to process
 * @param measure - The selected measure
 */
export function minBy(array: any[], measure: string) {
  return Math.min(...array.map((val) => val[measure]));
}

/**
 * Return the mean of the array by specific measure.
 * @param array - The array to process
 * @param measure - The selected measure
 */
export function meanBy(array: any[], measure: string) {
  return array.map((val) => val[measure]).reduce((acc, val) => acc + val, 0) / array.length;
}

/**
 * Return the groups of the array.
 * @param array - The array to process
 * @param measure - The selected measure
 */
export function groupBy(array: any[], measure: string) {
  const iter = ({ [measure]: prop }: any) => prop;
  const dataArray = isArray(array) ? array : Object.values(array);
  return dataArray.reduce((result, item) => {
    const id = iter(item);
    if (!result[id]) {
      Object.assign(result, { [id]: [] });
    }
    result[id].push(item);
    return result;
  }, {});
}

export type AggregateMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN';

export type Aggregator = (data: any, measure: string) => number;

export const AggregatorMap: Record<AggregateMethod, Aggregator> = {
  SUM: sumBy,
  COUNT: countBy,
  MAX: maxBy,
  MIN: minBy,
  MEAN: meanBy,
};

/**
 * Aggregate data via different aggregation methods
 * @param array - The array to process
 * @param dimensionField - The selected dimensions
 * @param measure - The selected measure
 * @param aggMethod - The selected aggregation method
 * @param seriesField - The selected series
 * @returns
 */
export function aggregate(
  array: any[],
  dimensionField: string,
  measure: string,
  aggMethod: AggregateMethod = 'SUM',
  seriesField?: string
) {
  const grouped = groupBy(array, dimensionField);
  const aggregator = AggregatorMap[aggMethod];
  if (!seriesField) {
    return Object.entries(grouped).map(([value, dataGroup]) => {
      return {
        [dimensionField]: value,
        [measure]: aggregator(dataGroup, measure),
      };
    });
  }
  return flatten(
    Object.entries(grouped).map(([value, dataGroup]) => {
      const childGrouped = groupBy(dataGroup as [], seriesField);
      const part = Object.entries(childGrouped).map(([childValue, childDataGroup]) => {
        return {
          [seriesField]: childValue,
          [measure]: sumBy(childDataGroup as [], measure),
        };
      });
      return part.map((item) => {
        return {
          ...item,
          [dimensionField]: value,
        };
      });
    })
  );
}
