import { mean } from 'lodash';
import { cdf } from '@stdlib/stats/base/dists/normal';

import { standardDeviation } from '../../data';

export const calculatePValue = (values: number[], target: number) => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const pValue = 1 - cdf(target, meanValue, std);
  return pValue;
};
