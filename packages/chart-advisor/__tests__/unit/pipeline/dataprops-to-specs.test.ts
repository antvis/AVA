import { dataPropsToSpecs, DataProperty } from '../../../src';

describe('API - dataPropsToSpecs', () => {
  describe('Results', () => {
    test('should work for valid dataProps', () => {
      const dataProps: DataProperty[] = [
        {
          count: 6,
          distinct: 6,
          type: 'string',
          recommendation: 'string',
          missing: 0,
          samples: ['华东', '中南', '东北', '华北', '西北', '西南'],
          valueMap: {
            华东: 1,
            中南: 1,
            东北: 1,
            华北: 1,
            西北: 1,
            西南: 1,
          },
          maxLength: 2,
          minLength: 2,
          meanLength: 2,
          containsChars: false,
          containsDigits: false,
          containsSpace: false,
          containsNonWorlds: false,
          name: '地区',
          levelOfMeasurements: ['Nominal'],
        },
        {
          count: 6,
          distinct: 6,
          type: 'float',
          recommendation: 'float',
          missing: 0,
          samples: [
            4684506.442,
            4137415.0929999948,
            2681567.469000001,
            2447301.017000004,
            815039.5959999998,
            1303124.508000002,
          ],
          valueMap: {
            '4684506.442': 1,
            '4137415.0929999948': 1,
            '2681567.469000001': 1,
            '2447301.017000004': 1,
            '815039.5959999998': 1,
            '1303124.508000002': 1,
          },
          minimum: 815039.5959999998,
          maximum: 4684506.442,
          mean: 2678159.0208333335,
          percentile5: 815039.5959999998,
          percentile25: 1303124.508000002,
          percentile50: 2447301.017000004,
          percentile75: 4137415.0929999948,
          percentile95: 4684506.442,
          sum: 16068954.125,
          variance: 1928349866117.3848,
          stdev: 1388650.3757668396,
          zeros: 0,
          name: '销售额',
          levelOfMeasurements: ['Interval', 'Continuous'],
        },
      ];

      const specs = dataPropsToSpecs(dataProps);

      console.log(specs);
    });
  });
});
