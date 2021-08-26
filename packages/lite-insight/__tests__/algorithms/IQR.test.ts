import { IQR } from '../../src/algorithms';

const data = [38, 52, 61, 145, 48, 38, 38, 38];

describe('IQR', () => {
  test('check outliers result', () => {
    expect(IQR(data).upper.indexes).toStrictEqual([3]);
  });
});
