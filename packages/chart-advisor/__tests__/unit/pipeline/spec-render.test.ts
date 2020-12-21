import { specRender, dataToAdvices } from '../../../src';
import { createDiv } from '../../utils/dom';

describe('API - specRender', () => {
  describe('Results', () => {
    test('should work for basic lib config', () => {
      const data = [
        { city: 'London', value: 100 },
        { city: 'Beijing', value: 200 },
        { city: 'Shanghai', value: 600 },
      ];

      const specs = dataToAdvices(data);
      const spec = specs[0];

      const plot = specRender(createDiv(), data, spec);

      // @ts-ignore
      expect(plot.type).toBe('pie');
    });
  });
});
