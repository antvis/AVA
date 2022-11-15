import _mean from 'lodash/mean';
import { statistics } from '@antv/data-wizard';
import { cdf } from '@stdlib/stats/base/dists/normal';

export const calculatePValue = (values: number[], target: number) => {
  const mean = _mean(values);
  const std = statistics.standardDeviation(values);
  const pValue = 1 - cdf(target, mean, std);
  return pValue;
};
