import _sumBy from 'lodash/sumBy';
import _sum from 'lodash/sum';
import _mean from 'lodash/mean';
import maxabs from '@stdlib/stats/base/maxabs';
import { calcPValue } from './window';

/**
 * Buishad U statistics test
 */
export const buishandUTest = (data: number[]) => {
  const n = data?.length;
  const mean = _mean(data);
  const Sk = data.map((_, index) => _sum(data.slice(0, index + 1)) - mean * (index + 1));
  const U = _sumBy(Sk.slice(0, n - 1), (item) => item ** 2) / (n * (n + 1));
  const Smax = maxabs(n, Sk, 1);

  const maxIndex = Sk.findIndex((item) => item === Smax);

  return {
    U,
    index: maxIndex,
    significance: 1 - calcPValue(data, maxIndex),
  };
};
