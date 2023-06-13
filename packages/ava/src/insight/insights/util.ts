import { mean } from 'lodash';

import { standardDeviation, cdf, normalDistributionQuantile, max, min } from '../../data';

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

export const calculateOutlierThresholds = (
  values: number[],
  significance: number,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
): [number, number] => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const p = 1 - significance;
  if (alternative === 'greater') return [normalDistributionQuantile(significance, meanValue, std), max(values)];
  if (alternative === 'less') return [min(values), normalDistributionQuantile(p, meanValue, std)];
  return [
    normalDistributionQuantile(p / 2, meanValue, std),
    normalDistributionQuantile(significance + p / 2, meanValue, std),
  ];
};
