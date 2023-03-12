import { LOWESSOptions } from './types';

/** default options in LOWESS */
export const DEFAULT_OPTIONS: LOWESSOptions = {
  f: 2 / 3,
  nSteps: 3,
  delta: 4,
};
