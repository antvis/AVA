import { deepMix } from '../../../../src/advisor/utils';

describe('utils test', () => {
  test('deep-mix', () => {
    const data = [
      { price: 100, cost: 100, revenue: 500, amount: 150, type: 'A' },
      { price: 120, cost: 200, revenue: 550, amount: 250, type: 'B' },
      { price: 150, cost: 410, revenue: 600, amount: 60, type: 'C' },
    ];
    const spec = {
      type: 'point',
      data,
      encode: {
        x: 'price',
        y: 'volume',
      },
      axis: {
        domain: false,
      },
    };
    const partOfNewSpec = {
      axis: {
        ticks: false,
      },
    };
    deepMix(spec, partOfNewSpec);
    expect(spec.axis).toHaveProperty('ticks');
  });
});
