import { mergeWith } from 'lodash';

import { pearson } from './base';
import { DEFAULT_PCORRTEST_OPTIONS } from './constants';
import { normalDistributionQuantile, tDistributionQuantile } from './quantile';
import { PCorrTestOptions, PCorrTestOutput } from './types';

/** Perform a Pearson product-moment correlation test between paired samples  */
export const pcorrtest = (x: number[], y: number[], options?: PCorrTestOptions): PCorrTestOutput => {
  if (x.length !== y.length) {
    // eslint-disable-next-line no-console
    console.error('invalid arguments: First and second arguments must be arrays having the same length');
    return {
      pcorr: null,
      rejected: false,
    };
  }
  const { alpha, alternative, rho } = mergeWith(DEFAULT_PCORRTEST_OPTIONS, options, (defaultValue, inputValue) => {
    return inputValue ?? defaultValue;
  });
  /** pearson correlation coefficient */
  const pcorr = pearson(x, y);
  /** statistic to be tested */
  let statistic: number;
  let threshold: number;
  /** whether to reject null hypothesis */
  let rejected = false;
  if (rho !== 0) {
    /**
     * - if rho is provided, it needs to be corrected by Fisher's z transform so that it satisfies the normal distribution
     * - https://en.wikipedia.org/wiki/Fisher_transformation
     *  */
    const z = 0.5 * Math.log((1 + pcorr) / (1 - pcorr));
    /** mean of z */
    const meanZ = 0.5 * Math.log((1 + rho) / (1 - rho));
    /** standard error of z */
    const sigmaZ = 1 / Math.sqrt(x.length - 3);
    statistic = (z - meanZ) / sigmaZ;
    if (alternative === 'greater') {
      threshold = normalDistributionQuantile(1 - alpha);
      if (statistic >= threshold) rejected = true;
    } else if (alternative === 'less') {
      threshold = normalDistributionQuantile(alpha);
      if (statistic <= threshold) rejected = true;
    } else {
      threshold = normalDistributionQuantile(1 - alpha / 2);
      if (Math.abs(statistic) >= threshold) rejected = true;
    }
  } else {
    // obey the t distribution under the null hypothesis, t~t(n-2)
    const degree = x.length - 2;
    statistic = (pcorr * Math.sqrt(degree)) / Math.sqrt(1 - pcorr ** 2);
    if (alternative === 'greater') {
      threshold = tDistributionQuantile(1 - alpha, degree);
      if (statistic >= threshold) rejected = true;
    } else if (alternative === 'less') {
      threshold = tDistributionQuantile(alpha, degree);
      if (statistic <= threshold) rejected = true;
    } else {
      threshold = tDistributionQuantile(1 - alpha / 2, degree);
      if (Math.abs(statistic) >= threshold) rejected = true;
    }
  }

  return {
    rejected,
    pcorr,
  };
};
