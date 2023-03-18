import { bayesian } from '../../data/statistics/bayesian';
import { windowBasedMean } from '../../data/statistics/window';
import { pettittTest } from '../../data/statistics/pettitt-test';
import { buishandUTest } from '../../data/statistics/buishand-u';

export const changePoint = {
  Bayesian: bayesian,
  Window: windowBasedMean,
  PettittTest: pettittTest,
  BuishandUTest: buishandUTest,
};
