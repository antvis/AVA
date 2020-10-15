import { dataPropsToAdvices, DataProperty } from '../../../src';

describe('API - dataPropsToAdvices', () => {
  describe('Results', () => {
    test('should work for valid dataProps', () => {
      const dataProps: DataProperty[] = [
        {
          count: 3,
          distinct: 3,
          type: 'string',
          recommendation: 'string',
          missing: 0,
          samples: ['London', 'Beijing', 'Shanghai'],
          valueMap: {
            London: 1,
            Beijing: 1,
            Shanghai: 1,
          },
          maxLength: 8,
          minLength: 6,
          meanLength: 7,
          containsChars: true,
          containsDigits: false,
          containsSpace: false,
          containsNonWorlds: false,
          name: 'city',
          levelOfMeasurements: ['Nominal'],
        },
        {
          count: 3,
          distinct: 3,
          type: 'integer',
          recommendation: 'integer',
          missing: 0,
          samples: [100, 200, 600],
          valueMap: {
            '100': 1,
            '200': 1,
            '600': 1,
          },
          minimum: 100,
          maximum: 600,
          mean: 300,
          percentile5: 100,
          percentile25: 100,
          percentile50: 200,
          percentile75: 600,
          percentile95: 600,
          sum: 900,
          variance: 46666.666666666664,
          stdev: 216.02468994692867,
          zeros: 0,
          name: 'value',
          levelOfMeasurements: ['Interval', 'Discrete'],
        },
      ];

      const specs = dataPropsToAdvices(dataProps);

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
