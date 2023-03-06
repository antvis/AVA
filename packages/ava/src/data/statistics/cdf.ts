import { isNil } from 'lodash';

/**
 * Evaluates the cumulative distribution function (CDF) for a normal distribution at a value x
 * - Reference to equation 26.2.17 in Abramowitz and Stegun: Handbook of Mathematical Functions
 * @param mu mean
 * @param sigma standard deviation
 * */
export const cdf = (x: number, mu: number = 0, sigma: number = 1): number => {
  if (sigma < 0 || [x, mu, sigma].some((value) => isNil(value))) return NaN;
  // transfer to standard normal distribution
  const normalX = (x - mu) / sigma;
  /** probability density function of the standard normal distribution */
  const Zx = (1 / Math.sqrt(2 * Math.PI)) * Math.exp((-1 * normalX ** 2) / 2);
  const t = 1 / (1 + 0.33267 * normalX);
  // error less than 1e-5
  const Px = 1 - Zx * (0.4361836 * t - 0.1201676 * t ** 2 + 0.937298 * t ** 3);
  // consistent with the number of digits in @stdlib/stats/base/dists/normal
  return Number(Px.toFixed(3));
};