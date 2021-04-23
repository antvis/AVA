import { g2Render, dataToAdvices, adviceToLibConfig } from '../../../src';
import { createDiv } from '../../utils/dom';

describe('API - g2Render', () => {
  describe('Results', () => {
    test('should work for basic args', async () => {
      const data = [
        { city: 'London', value: 100 },
        { city: 'Beijing', value: 200 },
        { city: 'Shanghai', value: 600 },
      ];

      const specs = dataToAdvices(data);
      const spec = specs[0];

      const libConfig = adviceToLibConfig(spec, 'G2');

      const chart = await g2Render(createDiv(), data, libConfig!);

      // @ts-ignore
      expect(chart?.geometries[0].coordinate.type).toBe('theta');
    });
  });
});
