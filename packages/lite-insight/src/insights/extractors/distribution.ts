import _mean from 'lodash/mean';
import { statistics } from '@antv/data-wizard';
import kstest from '@stdlib/stats/kstest';

import { SignificanceBenchmark } from '../../constant';
import { Datum, Measure, DistributionType, DistributionInfo } from '../../interface';
import { stdev } from '../../utils/math';

type DistributionTest = {
  distribution: DistributionType;
  significance: number;
};

// normal distribution
export const findDistribution = (values: number[]): DistributionTest => {
  if (values.length < 20) return null;
  const mu = _mean(values);
  const sigma = stdev(values, mu);

  const normalTestResult = kstest(values, 'normal', mu, sigma);
  if (normalTestResult.pValue > SignificanceBenchmark) {
    return {
      distribution: 'normal',
      significance: normalTestResult.pValue,
    };
  }

  return null;
};

// @ts-ignore
export const extractor = (data: Datum[], dimensions: string[], measures: Measure[]): DistributionInfo[] => {
  if (!data || data.length === 0) return [];
  const measure = measures[0].field;
  const values = data.map((item) => item?.[measure] as number);
  if (statistics.distinct(values) === 1) return [];
  const distributionResult: DistributionTest = findDistribution(values);
  if (distributionResult) {
    const { distribution, significance } = distributionResult;
    return [
      {
        type: 'distribution',
        distribution,
        significance,
      },
    ];
  }
  return [];
};
