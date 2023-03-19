import { mean } from 'lodash';

import { standardDeviation, cdf } from '../../data';

export const calculatePValue = (
  values: number[],
  target: number,
  alternative: 'two-sided' | 'less' | 'greater' = 'greater'
) => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const cdfValue = cdf(target, meanValue, std);
  if (alternative === 'two-sided') return cdfValue < 0.5 ? cdfValue : 1 - cdfValue;
  if (alternative === 'less') return cdfValue;
  return 1 - cdfValue;
};
