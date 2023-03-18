import { sumBy } from 'lodash';

import { rank } from '../../insight/utils/common';

import { ChangePointItem } from './types';

/**
 * Pettitt's (1979) method is a rank-based nonparametric test for abrupt changes in a time series.
 * */
export function pettittTest(data: number[]): ChangePointItem {
  const n = data?.length;
  const rankArr = rank(data);

  let Umax = 0;
  let UmaxIndex = -1;
  for (let k = 0; k < n; k += 1) {
    const U = Math.abs(2 * sumBy(rankArr.slice(0, k)) - k * (n + 1));
    if (U > Umax) {
      Umax = U;
      UmaxIndex = k;
    }
  }
  const pvalue = 2 * Math.exp((-6 * Umax ** 2) / (n ** 2 + n ** 3));
  return {
    index: UmaxIndex,
    significance: 1 - pvalue,
  };
}

/**
 * p-value calc in Pettitt
 */
export function calcPValue(data: number[], index: number) {
  const n = data?.length;
  const rankArr = rank(data);

  const U = Math.abs(2 * sumBy(rankArr.slice(0, index)) - index * (n + 1));

  const pvalue = 2 * Math.exp((-6 * U ** 2) / (n ** 2 + n ** 3));

  return pvalue;
}
