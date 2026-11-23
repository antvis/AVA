import { expect, it } from 'vitest';

import { augmentedDickeyFuller } from '../../../src/duckdb/profile-adf';

it('matches statsmodels with selected and fixed lag lengths', () => {
  const observations = [4, 2, 3, 1, 2, 5, 3, 6, 7, 3, 5, 7, 8, 1, 4, 9, 5, 2, 7, 5, 4, 2, 3, 5];
  for (const method of ['AIC', 'BIC', 't-stat'] as const) {
    expect(augmentedDickeyFuller(observations, 4, method, 0.05)).toEqual({
      statistic: expect.closeTo(-4.112290001864097, 12),
      pvalue: expect.closeTo(0.0009241995324734236, 12),
      used_lag: 1,
      observations: 22,
      stationary: true,
    });
  }
  expect(augmentedDickeyFuller(observations, 4, null, 0.05)).toEqual({
    statistic: expect.closeTo(-2.2017073348352136, 12),
    pvalue: expect.closeTo(0.20562637648636328, 12),
    used_lag: 4,
    observations: 19,
    stationary: false,
  });
  expect(augmentedDickeyFuller([4, 4, 4, 4], 0, 'AIC', 0.05)).toBeNull();
});
