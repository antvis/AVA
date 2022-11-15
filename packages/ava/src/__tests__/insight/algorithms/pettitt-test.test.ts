import { pettittTest } from '../../src/algorithms/change-point/pettitt-test';

const data = [
  2413.291, 2201.967, 2363.555, 2086.259, 2070.092, 2242.442, 3091.346, 1326.768, 1595.619, 1631.493, 1797.879,
  2044.798, 1904.171, 1746.416, 1875.368, 1826.619, 1853.982, 1887.834, 1802.647, 1783.05, 1925.268, 1777.375, 1970.239,
  1782.715,
];

describe('Pettitt Test', () => {
  test('check change point result', () => {
    expect(pettittTest(data).index).toBe(7);
  });
});
