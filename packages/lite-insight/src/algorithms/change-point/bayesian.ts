import BayesianChangePoint, { BreakPoint } from 'bayesian-changepoint';
import { calcPValue } from './pettitt-test';

const breakpointVerifier = (next: BreakPoint<number>, prev: BreakPoint<number>): boolean => {
  if (Math.abs(next.data - prev.data) >= 1) {
    return true;
  }

  return false;
};

type ChangePointItem = {
  index: number;
  significance: number;
};

/**
 * Bayesian Online Changepoint Detection
 */
export const Bayesian = (series: number[]): ChangePointItem[] => {
  const detection = new BayesianChangePoint<number>({
    breakpointVerifier,
  });

  detection.exec(series);

  const result = detection.breakPoints().map((breakPoint) => ({
    index: breakPoint.index,
    significance: 1 - calcPValue(series, breakPoint.index),
  }));

  return result;
};
