import { Bayesian } from './bayesian';
import { windowBasedMean } from './window';
import { pettittTest } from './pettitt-test';
import { buishandUTest } from './buishand-u';

export const ChangePoint = {
  Bayesian,
  Window: windowBasedMean,
  PettittTest: pettittTest,
  BuishandUTest: buishandUTest,
};
