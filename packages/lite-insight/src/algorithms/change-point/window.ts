import _mean from 'lodash/mean';
import { SignificanceBenchmark } from '../../constant';
import { calculatePValue } from '../../insights/util';

const DEFAULT_WINDOW_SIZE = 4;

/**
 * Window-based change point detection
 */
export const windowBasedMean = (data: number[], params?: { windowSize?: number; significanceLimit?: number }) => {
  const len = data?.length;

  const K = params?.windowSize || DEFAULT_WINDOW_SIZE;

  if (len <= 2 * K + 3) return [];

  const significanceLimit = params?.significanceLimit || SignificanceBenchmark;

  const diff = Array(len).fill(0);
  for (let i = K; i <= len - K; i += 1) {
    const meanLeft = _mean(data.slice(i - K, i));
    const meanRight = _mean(data.slice(i, i + K));
    diff[i] = Math.abs(meanLeft - meanRight);
  }

  const differences = diff.slice(K, len - K + 1);
  const sorted = differences.sort((a, b) => b - a);
  const result = [];
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
};

/**
 * Window-based change point test
 */
export const calcPValue = (data: number[], index: number, window?: number) => {
  const len = data?.length;

  const K = window || DEFAULT_WINDOW_SIZE;

  if (len <= 2 * K + 3) return 0;
  const diff = Array(len).fill(0);
  for (let i = K; i <= len - K; i += 1) {
    const meanLeft = _mean(data.slice(i - K, i));
    const meanRight = _mean(data.slice(i, i + K));
    diff[i] = Math.abs(meanLeft - meanRight);
  }

  const p = calculatePValue(diff.slice(K, len - K + 1), diff[index]);

  return p;
};
