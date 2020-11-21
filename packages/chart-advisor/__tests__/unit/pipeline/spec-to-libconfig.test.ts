import { Advice, adviceToLibConfig } from '../../../src';

describe('API - adviceToLibConfig', () => {
  describe('Results', () => {
    test('should work for basic spec', () => {
      const spec: Advice = {
        type: 'pie_chart',
        spec: {
          mark: {
            type: 'arc',
          },
          encoding: {
            theta: {
              field: 'value',
              type: 'quantitative',
            },
            color: {
              field: 'city',
              type: 'nominal',
            },
          },
        },
        score: 1.8111111111111111,
      };

      const libConfig = adviceToLibConfig(spec);

      expect(libConfig).toEqual({
        type: 'Pie',
        configs: {
          angleField: 'value',
          colorField: 'city',
        },
      });
    });
  });
});
