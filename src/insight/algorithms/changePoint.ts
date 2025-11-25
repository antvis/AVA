import { bayesian } from '../../utils/statistics/bayesian';
import { windowBasedMean } from '../../utils/statistics/window';
import { pettittTest } from '../../utils/statistics/pettitt-test';
import { buishandUTest } from '../../utils/statistics/buishand-u';

export const changePoint = {
  Bayesian: bayesian,
  Window: windowBasedMean,
  PettittTest: pettittTest,
  BuishandUTest: buishandUTest,
};
