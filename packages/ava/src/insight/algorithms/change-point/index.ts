import { bayesian } from './bayesian';
import { windowBasedMean } from './window';
import { pettittTest } from './pettitt-test';
import { buishandUTest } from './buishand-u';

export const ChangePoint = {
  Bayesian: bayesian,
  Window: windowBasedMean,
  PettittTest: pettittTest,
  BuishandUTest: buishandUTest,
};
