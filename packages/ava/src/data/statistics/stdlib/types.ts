/**
 * function options of LOWESS method
 */
export type LOWESSOptions = {
  /**
   * Proportion of points for local regression which influence smoothing at each value; default: 2/3
   * */
  f?: number;
  /**
   * Number of iterations for local regression (fewer iterations translates to faster function execution; default: 3)
   * */
  nSteps?: number;
  /**
   * Nonnegative parameter which may be used to reduce the number of computations.
   * Perform a local regression at intervals of delta data points.
   * */
  delta?: number;
};

/**
 * LOWESS output
 */
export type LOWESSOutput = {
  /** Fitted values */
  y: number[];
};

export type PCorrTestOptions = {
  /**
   * Significance level (default: 0.05).
   */
  alpha?: number;
  /**
   * Alternative hypothesis (`two-sided`, `less`, or `greater`; default: 'two-sided').
   */
  alternative?: 'two-sided' | 'less' | 'greater';
  /**
   * Correlation under H0 (default: 0.0).
   * To test whether the correlation coefficient is equal to some other value than 0.
   */
  rho?: number;
};

export type PCorrTestOutput = {
  /**
   * whether to reject null hypothesis
   * */
  rejected: boolean;
  /**
   * pearson correlation coefficient
   * */
  pcorr: number;
  /**
   * used significance level
   * */
  alpha?: number;
  /**
   * statistic to be tested
   * */
  statistic?: number;
  /**
   * used alternative hypothesis (`two-sided`, `less` or `greater`).
   * */
  alternative?: string;
  /**
   * assumed correlation under H0 (equal to the supplied `rho` option).
   * */
  nullValue?: number;
};
