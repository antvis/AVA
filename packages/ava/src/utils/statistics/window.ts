import { mean } from 'lodash';
import { standardDeviation, cdf } from '@ava/utils/statistics';
import { ChangePointItem } from './types';

const DEFAULT_WINDOW_SIZE = 4;
export const SIGNIFICANCE_BENCHMARK = 0.95;

export const calculatePValue = (
  values: number[],
  target: number,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
) => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const cdfValue = cdf(target, meanValue, std);
  if (alternative === 'two-sided') return cdfValue < 0.5 ? 2 * cdfValue : 2 * (1 - cdfValue);
  if (alternative === 'less') return cdfValue;
  return 1 - cdfValue;
};

/**
 * Window-based change point detection
 */
export function windowBasedMean(
  data: number[],
  params?: { windowSize?: number; significanceLimit?: number }
): ChangePointItem[] {
  const len = data?.length;

  const K = params?.windowSize || DEFAULT_WINDOW_SIZE;

  if (len <= 2 * K + 3) return [];

  const significanceLimit = params?.significanceLimit || SIGNIFICANCE_BENCHMARK;

  const diff = Array(len).fill(0);
  for (let i = K; i <= len - K; i += 1) {
    const meanLeft = mean(data.slice(i - K, i));
    const meanRight = mean(data.slice(i, i + K));
    diff[i] = Math.abs(meanLeft - meanRight);
  }

  const differences = diff.slice(K, len - K + 1);
  const sorted = differences.sort((a, b) => b - a);
  const result: ChangePointItem[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const difference = sorted[i];
    const index = diff.findIndex((item) => item === difference);
    const significance = 1 - calculatePValue(differences, difference);
    if (significance >= significanceLimit) {
      result.push({
        index,
        significance,
      });
    }
  }

  return result;
}

/**
 * Window-based change point test
 */
export function calcPValue(data: number[], index: number, window?: number) {
  const len = data?.length;

  const K = window || DEFAULT_WINDOW_SIZE;

  if (len <= 2 * K + 3) return 0;
  const diff = Array(len).fill(0);
  for (let i = K; i <= len - K; i += 1) {
    const meanLeft = mean(data.slice(i - K, i));
    const meanRight = mean(data.slice(i, i + K));
    diff[i] = Math.abs(meanLeft - meanRight);
  }

  const p = calculatePValue(diff.slice(K, len - K + 1), diff[index]);

  return p;
}
