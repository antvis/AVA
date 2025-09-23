import { bayesian } from '@ava/utils/statistics/bayesian';
import { windowBasedMean } from '@ava/utils/statistics/window';
import { pettittTest } from '@ava/utils/statistics/pettitt-test';
import { buishandUTest } from '@ava/utils/statistics/buishand-u';

export const changePoint = {
  Bayesian: bayesian,
  Window: windowBasedMean,
  PettittTest: pettittTest,
  BuishandUTest: buishandUTest,
};
