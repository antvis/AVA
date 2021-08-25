import _mean from 'lodash/mean';
import { deviation } from 'd3-array';
import { cdf } from '@stdlib/stats/base/dists/normal';

export const calculatePValue = (values: number[], target: number) => {
  const mean = _mean(values);
  const std = deviation(values) as number;

  const pValue = 1 - cdf(target, mean, std);
  return pValue;
};
