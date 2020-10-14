import { dataToSpecs } from '../../../src';

describe('API - dataToSpecs', () => {
  describe('Results', () => {
    test('should work for valid data', () => {
      const data = [
        { city: 'London', value: 100 },
        { city: 'Beijing', value: 200 },
        { city: 'Shanghai', value: 600 },
      ];

      const specs = dataToSpecs(data);

      expect(specs).toEqual([
        {
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
        },
        {
          type: 'donut_chart',
          spec: {
            mark: {
              type: 'arc',
              innerRadius: 50,
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
        },
        {
          type: 'column_chart',
          spec: {
            mark: {
              type: 'bar',
            },
            encoding: {
              x: {
                field: 'city',
                type: 'nominal',
              },
              y: {
                field: 'value',
                type: 'quantitative',
              },
            },
          },
          score: 1.5,
        },
        {
          type: 'bar_chart',
          spec: {
            mark: {
              type: 'bar',
            },
            encoding: {
              x: {
                field: 'value',
                type: 'quantitative',
              },
              y: {
                field: 'city',
                type: 'nominal',
              },
            },
          },
          score: 1.5,
        },
      ]);
    });
  });
});
