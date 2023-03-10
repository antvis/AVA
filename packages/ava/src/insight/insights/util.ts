import { mean } from 'lodash';

import { standardDeviation } from '../../data';
import { cdf } from '../../data/statistics/stdlib';

export const calculatePValue = (values: number[], target: number) => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const pValue = 1 - cdf(target, meanValue, std);
  return pValue;
};
