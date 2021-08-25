import _sumBy from 'lodash/sumBy';
import { rank } from '../utils/common';

// Pettitt's (1979) method is a rank-based nonparametric test for
// abrupt changes in a time series.
export const pettittTest = (data: number[]) => {
  const n = data?.length;
  const rankArr = rank(data);

  let Umax = 0;
  let UmaxIndex = -1;
  for (let k = 0; k < n; k += 1) {
    const U = Math.abs(2 * _sumBy(rankArr.slice(0, k)) - k * (n + 1));
    if (U > Umax) {
      Umax = U;
      UmaxIndex = k;
    }
  }
  const pvalue = 2 * Math.exp((-6 * Umax ** 2) / (n ** 2 + n ** 3));
  return {
    index: UmaxIndex - 1,
    value: data[UmaxIndex - 1],
    significance: 1 - pvalue,
  };
};
