import { deepMix } from '../src/advisor/utils';

describe('utils test', () => {
  test('deep-mix', () => {
    const data = [
      { price: 100, cost: 100, revenue: 500, amount: 150, type: 'A' },
      { price: 120, cost: 200, revenue: 550, amount: 250, type: 'B' },
      { price: 150, cost: 410, revenue: 600, amount: 60, type: 'C' },
    ];
    const spec = {
      basis: { type: 'chart' },
      data: { type: 'json-array', values: data },
      layer: [
        {
          mark: { type: 'point' },
          encoding: {
            x: { field: 'price', type: 'quantitative' },
            y: { field: 'volume', type: 'quantitative' },
          },
        },
      ],
    };
    const partOfNewSpec = {
      encoding: {
        x: {
          axis: {
            domain: false,
            ticks: false,
          },
        },
      },
    };
    deepMix(spec.layer[0], partOfNewSpec);
    expect(spec.layer[0].encoding.x).toHaveProperty('axis');
  });
});
