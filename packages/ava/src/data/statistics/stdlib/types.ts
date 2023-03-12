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
  /**
   * Fitted values
   * */
  y: number[];
};
