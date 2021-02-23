import { dataToDataProps } from '../../../src';

describe('API - dataToDataProps', () => {
  describe('Results', () => {
    test('should work for basic dataset', () => {
      const data = [
        { city: 'London', value: 100 },
        { city: 'Beijing', value: 200 },
        { city: 'Shanghai', value: 600 },
      ];

      const dataProps = dataToDataProps(data);

      expect(dataProps).toEqual([
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
      ]);
    });

    test('should work for single column dataset', () => {
      const data = [
        { value: 1.2 },
        { value: 3.4 },
        { value: 3.7 },
        { value: 4.3 },
        { value: 5.2 },
        { value: 5.8 },
        { value: 6.1 },
        { value: 6.5 },
        { value: 6.8 },
        { value: 7.1 },
        { value: 17.3 },
        { value: 17.5 },
        { value: 17.9 },
        { value: 18 },
        { value: 18 },
        { value: 20.6 },
        { value: 21 },
        { value: 23.4 },
      ];

      const dataProps = dataToDataProps(data);

      expect(dataProps).toEqual([
        {
          count: 18,
          distinct: 17,
          type: 'mixed',
          recommendation: 'float',
          missing: 0,
          samples: [1.2, 3.4, 3.7, 4.3, 5.2, 5.8, 6.1, 6.5, 6.8, 7.1, 17.3, 17.5, 17.9, 18, 18, 20.6, 21, 23.4],
          valueMap: {
            '18': 2,
            '21': 1,
            '1.2': 1,
            '3.4': 1,
            '3.7': 1,
            '4.3': 1,
            '5.2': 1,
            '5.8': 1,
            '6.1': 1,
            '6.5': 1,
            '6.8': 1,
            '7.1': 1,
            '17.3': 1,
            '17.5': 1,
            '17.9': 1,
            '20.6': 1,
            '23.4': 1,
          },
          meta: {
            float: {
              count: 15,
              distinct: 15,
              type: 'float',
              recommendation: 'float',
              missing: 0,
              samples: [1.2, 3.4, 3.7, 4.3, 5.2, 5.8, 6.1, 6.5, 6.8, 7.1, 17.3, 17.5, 17.9, 20.6, 23.4],
              valueMap: {
                '1.2': 1,
                '3.4': 1,
                '3.7': 1,
                '4.3': 1,
                '5.2': 1,
                '5.8': 1,
                '6.1': 1,
                '6.5': 1,
                '6.8': 1,
                '7.1': 1,
                '17.3': 1,
                '17.5': 1,
                '17.9': 1,
                '20.6': 1,
                '23.4': 1,
              },
              minimum: 1.2,
              maximum: 23.4,
              mean: 9.786666666666667,
              percentile5: 1.2,
              percentile25: 4.3,
              percentile50: 6.5,
              percentile75: 17.5,
              percentile95: 23.4,
              sum: 146.8,
              variance: 49.543822222222225,
              stdev: 7.03873726049085,
              zeros: 0,
            },
            integer: {
              count: 3,
              distinct: 2,
              type: 'integer',
              recommendation: 'integer',
              missing: 0,
              samples: [18, 18, 21],
              valueMap: {
                '18': 2,
                '21': 1,
              },
              minimum: 18,
              maximum: 21,
              mean: 19,
              percentile5: 18,
              percentile25: 18,
              percentile50: 18,
              percentile75: 21,
              percentile95: 21,
              sum: 57,
              variance: 2,
              stdev: 1.4142135623730951,
              zeros: 0,
            },
          },
          minimum: 1.2,
          maximum: 23.4,
          mean: 11.322222222222223,
          percentile5: 1.2,
          percentile25: 5.2,
          percentile50: 6.8,
          percentile75: 18,
          percentile95: 23.4,
          sum: 203.8,
          variance: 53.4095061728395,
          stdev: 7.308180770399669,
          zeros: 0,
          name: 'value',
          levelOfMeasurements: ['Interval', 'Continuous'],
        },
      ]);
    });
  });

  describe('Arguments Validation', () => {
    test('should throw an error if no argument', () => {
      function callWithoutArgument() {
        // @ts-ignore
        dataToDataProps();
      }
      expect(callWithoutArgument).toThrowError('missing');
    });

    test('select specific fields', () => {
      const data = [
        { city: 'London', value: 100 },
        { city: 'Beijing', value: 200 },
        { city: 'Shanghai', value: 600 },
      ];

      const dataProps = dataToDataProps(data, ['city']);
      expect(dataProps.length).toBe(1);
      expect(dataProps[0].name).toBe('city');
    });
  });
});
