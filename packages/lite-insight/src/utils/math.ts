import _mean from 'lodash/mean';

export const stdev = (arr: number[], mean?: number) => {
  const mu = mean === undefined ? _mean(arr) : mean;
  const acc = arr.reduce((acc, item) => {
    return acc + (item - mu) ** 2;
  }, 0);
  const variance = acc / arr.length;
  return Math.sqrt(variance);
};
