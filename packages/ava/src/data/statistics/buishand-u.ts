import { sumBy, sum, mean } from 'lodash';

import { maxabs } from '..';

import { calcPValue } from './window';

import type { ChangePointItem } from './types';

/**
 * Buishad U statistics test
 */
export function buishandUTest(data: number[]): ChangePointItem & { uValue: number } {
  const n = data?.length;
  const meanValue = mean(data);
  const Sk = data.map((_, index) => sum(data.slice(0, index + 1)) - meanValue * (index + 1));
  const U = sumBy(Sk.slice(0, n - 1), (item) => item ** 2) / (n * (n + 1));
  const Smax = maxabs(Sk);

  const maxIndex = Sk.findIndex((item) => item === Smax);

  return {
    uValue: U,
    index: maxIndex,
    significance: 1 - calcPValue(data, maxIndex),
  };
}
