import { vl2asp } from '../../../src/translator';
import cars from '../../../../../common/data/cars.json';
import { getFieldsFromData } from '../../../src/data-parse';
import { VegaLite } from '../../../src/interfaces';

describe('UNIT TEST - chart-linter/translator/vl2asp', () => {
  test('should work', async () => {
    const input: VegaLite = {
      data: { values: cars },
      mark: 'bar',
      encoding: {
        x: { field: 'Origin', aggregate: 'sum', bin: true, type: 'nominal' },
        y: { field: 'Horsepower', type: 'quantitative', aggregate: 'sum' },
      },
    };

    const fieldInfos = await getFieldsFromData(input);

    const output = [
      'mark(bar).',
      'data("data/cars.json").',
      'encoding(e0).',
      'channel(e0,x).',
      'field(e0,"Origin").',
      'fieldtype(origin, string).',
      'aggregate(e0,sum).',
      'bin(e0,10).',
      'type(e0,nominal).',
      'encoding(e1).',
      'channel(e1,y).',
      'field(e1,"Horsepower").',
      'fieldtype(horsepower, number).',
      'extent(horsepower, 46, 230).',
      'type(e1,quantitative).',
      'aggregate(e1,sum).',
      'zero(e1).',
    ];

    // FIXME
    // expect(vl2asp(input as any, fieldInfos)).toEqual(output);
    console.log(vl2asp(input as any, fieldInfos));
    console.log(output);
  });
});
