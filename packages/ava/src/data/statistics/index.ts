/*
 * Statistical methods used internally by ava.
 */

import { assert, isNumber, isString } from '../utils';

import * as cache from './caches';

/**
 * Get the minimum of the array.
 * @param value - The array to process
 */
export function min(value: number[]): number {
  const cachedValue = cache.get<number>(value, 'min');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'min', Math.min(...value));
}

function getMinIndex(value: number[]) {
  let min = value[0];
  let idx = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] < min) {
      idx = i;
      min = value[i];
    }
  }
  return idx;
}

/**
 * Get the minimum index of the array.
 * @param value - The array to process
 */
export function minIndex(value: number[]): number {
  const cachedValue = cache.get<number>(value, 'minIndex');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'minIndex', getMinIndex(value));
}

/**
 * Get the maximum of the array.
 * @param value - The array to process
 */
export function max(value: number[]): number {
  const cachedValue = cache.get<number>(value, 'max');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'max', Math.max(...value));
}

function getMaxIndex(value: number[]) {
  let max = value[0];
  let idx = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] > max) {
      idx = i;
      max = value[i];
    }
  }
  return idx;
}

/**
 * Get the maximum index of the array.
 * @param value - The array to process
 */
export function maxIndex(value: number[]): number {
  const cachedValue = cache.get<number>(value, 'maxIndex');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'maxIndex', getMaxIndex(value));
}

/**
 * Calculate the sum of the array.
 * @param value - The array to process
 */
export function sum(value: number[]): number {
  const cachedValue = cache.get<number>(value, 'sum');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(
    value,
    'sum',
    value.reduce((prev, current) => current + prev, 0)
  );
}

/**
 * Calculate the mean of the array.
 * @param value - The array to process

 */
export function mean(value: number[]): number {
  return sum(value) / value.length;
}

/**
 * Calculate the geometricMean of the array.
 * @param value - The array to process
 */
export function geometricMean(value: number[]): number {
  assert(
    value.some((item) => item > 0),
    'Each item in value must greater than 0.'
  );

  const cachedValue = cache.get<number>(value, 'geometricMean');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'geometricMean', value.reduce((prev, curr) => prev * curr, 1) ** (1 / value.length));
}

/**
 * Calculate the harmonic mean of the array.
 * @param value - The array to process
 */
export function harmonicMean(value: number[]): number {
  const base = 2 ** 16;
  const cachedValue = cache.get<number>(value, 'harmonicMean');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'harmonicMean', (base * value.length) / value.reduce((prev, curr) => base / curr + prev, 0));
}

function sort(value: number[]): number[] {
  return value.sort((l, r) => (l > r ? 1 : -1));
}

/**
 * Calculate the median of the array.
 * @param value - The array to process
 */
export function median(value: number[], sorted = false): number {
  const { length } = value;
  const newArray = sorted ? value : sort(value);
  if (length % 2 === 1) return newArray[(length - 1) / 2];
  return (newArray[length / 2 - 1] + newArray[length / 2]) / 2;
}

/**
 * Calculate the quartile of the array.
 * @param value - The array to process
 * @param sorted - Whether it is sorted
 */
export function quartile(value: number[], sorted = false): [number, number, number] {
  assert(value.length >= 3, 'The length of value cannot be less than 3.');

  const { length } = value;
  const newArray = sorted ? value : sort(value);
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
 * Calculate the quantile of the array.
 * @param value - The array to process
 * @param percent - percent
 * @param sorted - Whether it is sorted
 */
export function quantile(value: number[], percent: number, sorted = false): number {
  assert(percent > 0 && percent < 100, 'The percent cannot be between (0, 100).');

  const newArray = sorted ? value : sort(value);
  const index = Math.ceil((value.length * percent) / 100) - 1;
  return newArray[index];
}

/**
 * Calculate the variance of the array.
 * @param value - The array to process
 */
export function variance(value: number[]): number {
  const m = mean(value);
  const cachedValue = cache.get<number>(value, 'variance');
  if (cachedValue !== undefined) return cachedValue;
  return cache.set(value, 'variance', value.reduce((prev, curr) => prev + (curr - m) ** 2, 0) / value.length);
}

/**
 * Calculate the standard deviation of the array.
 * @param value - The array to process
 */
export function standardDeviation(value: number[]): number {
  return Math.sqrt(variance(value));
}

/**
 * Calculate the coefficient of variance of the array.
 * @param value - The array to process
 */
export function coefficientOfVariance(value: number[]): number {
  const stdev = standardDeviation(value);
  const arrayMean = mean(value);
  return stdev / arrayMean;
}

/**
 * Calculate the covariance of the array.
 * @param x - variable x
 * @param y - variable y
 */
export function covariance(x: number[], y: number[]): number {
  assert(x.length === y.length, 'The x and y must has same length.');

  const exy = mean(x.map((item, i) => item * y[i]));
  return exy - mean(x) * mean(y);
}

/**
 * Calculate the pearson correlation coefficient of two value.
 * @param x - variable x
 * @param y - variable y
 */
export function pearson(x: number[], y: number[]): number {
  const cov = covariance(x, y);
  const dx = standardDeviation(x);
  const dy = standardDeviation(y);
  return cov / (dx * dy);
}

/**
 * Calculate the counts of valid value in the array.
 * @param value - The array to process
 */
export function valid(value: unknown[]): number {
  let count = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i]) count += 1;
  }
  return count;
}

/**
 * Calculate the counts of missing value in the array.
 * @param value - The array to process
 */
export function missing(value: unknown[]): number {
  return value.length - valid(value);
}

/**
 * Calculate the counts of each distinct value in the array.
 * @param value - The array to process
 */
export function valueMap(value: unknown[]): Record<string, number> {
  const data: Record<string | number, number> = {};
  value.forEach((v) => {
    if (isString(v) || isNumber(v)) {
      if (data[v]) data[v] += 1;
      else data[v] = 1;
    }
  });
  return data;
}

/**
 * Calculate the counts of distinct value in the array.
 * @param value - The array to process
 */
export function distinct(value: unknown[]): number {
  return Object.keys(valueMap(value)).length;
}
