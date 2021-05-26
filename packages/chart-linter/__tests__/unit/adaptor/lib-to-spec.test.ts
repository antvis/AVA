import { libConfigToSpec, G2PlotConfig } from '../../../src/adaptor';

describe('API - libConfigToSpec', () => {
  describe('Results', () => {
    test('should work for G2Plot basic column', () => {
      const g2plotConfig: G2PlotConfig = {
        type: 'column',
        options: {
          xField: 'type',
          yField: 'sales',
          label: {
            position: 'middle',
            style: {
              fill: '#FFFFFF',
              opacity: 0.6,
            },
          },
          xAxis: {
            label: {
              autoHide: true,
              autoRotate: false,
            },
          },
          meta: {
            type: {
              alias: 'category',
            },
          },
          data: [
            {
              type: 'furniture',
              sales: 38,
            },
            {
              type: 'food',
              sales: 52,
            },
            {
              type: 'fruit',
              sales: 61,
            },
            {
              type: 'lights',
              sales: 145,
            },
            {
              type: 'kitchen',
              sales: 48,
            },
            {
              type: 'garden',
              sales: 38,
            },
            {
              type: 'drink',
              sales: 38,
            },
            {
              type: 'pets',
              sales: 38,
            },
          ],
        },
      };

      const spec = libConfigToSpec(g2plotConfig);

      expect(spec).toEqual({
        mark: 'bar',
        encoding: {
          x: { field: 'type', type: 'nominal' },
          y: { field: 'sales', type: 'quantitative' },
        },
        data: {
          values: [
            { type: 'furniture', sales: 38 },
            { type: 'food', sales: 52 },
            { type: 'fruit', sales: 61 },
            { type: 'lights', sales: 145 },
            { type: 'kitchen', sales: 48 },
            { type: 'garden', sales: 38 },
            { type: 'drink', sales: 38 },
            { type: 'pets', sales: 38 },
          ],
        },
      });
    });
  });
});
