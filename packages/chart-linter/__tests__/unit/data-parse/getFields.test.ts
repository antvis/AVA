import { getFields } from '../../../src/data-parse';
import cars from '../../../../../common/data/cars.json';

describe('UNIT TEST - chart-linter/data-parse/getFields', () => {
  test('should work', () => {
    const input = cars;

    const output = [
      { field: 'Name', fieldType: 'string', type: 'nominal', cardinality: 311 },
      { field: 'Miles_per_Gallon', fieldType: 'number', type: 'quantitative', min: 9.0, max: 46.6, cardinality: 129 },
      { field: 'Cylinders', fieldType: 'number', type: 'quantitative', min: 3, max: 8, cardinality: 5 },
      { field: 'Displacement', fieldType: 'number', type: 'quantitative', min: 68.0, max: 455.0, cardinality: 83 },
      { field: 'Horsepower', fieldType: 'number', type: 'quantitative', min: 46.0, max: 230.0, cardinality: 93 },
      { field: 'Weight_in_lbs', fieldType: 'number', type: 'quantitative', min: 1613, max: 5140, cardinality: 356 },
      { field: 'Acceleration', fieldType: 'number', type: 'quantitative', min: 8.0, max: 24.8, cardinality: 96 },
      { field: 'Year', fieldType: 'datetime', type: 'temporal', cardinality: 12 },
      { field: 'Origin', fieldType: 'string', type: 'nominal', cardinality: 3 },
    ];

    expect(getFields(input)).toEqual(output);
  });

  test('should handle empty', () => {
    expect(getFields([])).toEqual([]);
  });
});
