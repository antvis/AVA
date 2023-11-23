import BayesianChangePoint, { BreakPoint } from 'bayesian-changepoint';

import { calcPValue } from './pettitt-test';

import type { ChangePointItem } from './types';

function breakpointVerifier(next: BreakPoint<number>, prev: BreakPoint<number>): boolean {
  if (Math.abs(next.data - prev.data) >= 1) {
    return true;
  }

  return false;
}

/**
 * Bayesian Online Changepoint Detection
 */
export function bayesian(series: number[] = []): ChangePointItem[] {
  const detection = new BayesianChangePoint<number>({
    breakpointVerifier,
    chunkSize: series.length,
    iteratee: (t: number) => t,
  });

  detection.exec(series);

  const result = detection.breakPoints().map((breakPoint) => ({
    index: breakPoint.index,
    significance: 1 - calcPValue(series, breakPoint.index),
  }));

  return result;
}
