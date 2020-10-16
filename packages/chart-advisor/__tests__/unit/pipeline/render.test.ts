import { g2Render, dataToSpecs, specToLibConfig } from '../../../src';
import { createDiv } from '../../utils/dom';

describe('API - g2Render', () => {
  describe('Results', () => {
    test('should work for basic args', () => {
      const data = [
        { city: 'London', value: 100 },
        { city: 'Beijing', value: 200 },
        { city: 'Shanghai', value: 600 },
      ];

      const specs = dataToSpecs(data);
      const spec = specs[0];

      const libConfig = specToLibConfig(spec, 'G2');

      const chart = g2Render(createDiv(), data, libConfig);

      // @ts-ignore
      expect(chart?.geometries[0].coordinate.type).toBe('theta');
    });
  });
});
