import { getFieldsFromData } from '../../../src/data-parse';
import cars from '../../../../../common/data/cars.json';
import { VegaLite } from '../../../src/interfaces';

describe('UNIT TEST - chart-linter/data-parse/getFieldsFromData', () => {
  test('should work for inline data', async () => {
    const input: VegaLite = {
      data: { values: cars },
      mark: 'bar',
      encoding: {
        x: { field: 'Origin', aggregate: 'sum', bin: true, type: 'nominal' },
        y: { field: 'Horsepower', type: 'quantitative', aggregate: 'sum' },
      },
    };

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

    expect(await getFieldsFromData(input)).toEqual(output);
  });

  test('should work for url data', async () => {
    // const input = cars;

    const input: VegaLite = {
      data: { url: 'https://gw.alipayobjects.com/os/bmw-prod/1d565782-dde4-4bb6-8946-ea6a38ccf184.json' },
      mark: 'line',
      encoding: {
        x: { field: 'Date', type: 'temporal' },
        y: { field: 'scales', type: 'quantitative' },
      },
    };

    const output = [
      {
        field: 'Date',
        fieldType: 'datetime',
        type: 'temporal',
        cardinality: 86,
      },
      {
        field: 'scales',
        fieldType: 'number',
        type: 'quantitative',
        cardinality: 84,
        min: 145,
        max: 2311,
      },
    ];

    expect(await getFieldsFromData(input)).toEqual(output);
  });
});
