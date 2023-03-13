/**
 * Normal distribution quantile function
 * - Reference to equation 26.2.23 in https://personal.math.ubc.ca/~cbm/aands/abramowitz_and_stegun.pdf
 * - If F(x) is the cumulative distribution function of a normal distribution N(mu, sigma), F(x) = p, quantile(p, mu, sigma) = x.
 * - The value range of p is [0, 1]. If p > 1 or p < 0, return NaN.
 * @param p input value
 * @param mu mean
 * @param sigma standard deviation
 * */
export const normalDistributionQuantile = (p: number, mu: number = 0, sigma: number = 1): number => {
  if (p > 1 || p < 0 || sigma < 0) return NaN;
  // formula requires that p is no more than 0.5
  const adjustedP = p <= 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(adjustedP));
  /**
   * Q(qXp) + F(qXp) = 1
   * - use approximate elementary functional algorithm, error less than 4.5e-4
   * @todo add document explaining the derivation process
   * */
  const qXp =
    t - (2.515517 + 0.802853 * t + 0.010328 * t ** 2) / (1 + 1.432788 * t + 0.189269 * t ** 2 + 0.001308 * t ** 3);
  // quantile of standard normal distribution
  const normalXp = p <= 0.5 ? -1 * qXp : qXp;
  // transfer to quantile of normal distribution N(mu, sigma)
  const Xp = sigma * normalXp + mu;
  /**
   * consistent with the number of digits in @stdlib/stats/base/dists/normal
   * @todo fix precision issue
   */
  return Number(Xp.toFixed(3));
};
