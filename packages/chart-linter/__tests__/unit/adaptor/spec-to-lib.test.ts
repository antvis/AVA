import { specToLibConfig, Specification } from '../../../src/adaptor';

describe('API - specToLibConfig', () => {
  describe('Results', () => {
    test('should work for Vega-Lite basic column', () => {
      const spec: Specification = {
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
      };

      const g2plotConfig = specToLibConfig(spec);

      expect(g2plotConfig).toEqual({
        type: 'column',
        options: {
          xField: 'type',
          yField: 'sales',
          data: [
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
