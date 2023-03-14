import { LowessOptions, PCorrTestOptions } from './types';

/** default options in LOWESS */
export const DEFAULT_LOWESS_OPTIONS: LowessOptions = {
  f: 2 / 3,
  nSteps: 3,
  delta: null,
};

/** default options in LOWESS */
export const DEFAULT_PCORRTEST_OPTIONS: PCorrTestOptions = {
  alpha: 0.05,
  alternative: 'two-sided',
  rho: 0,
};
