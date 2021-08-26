import { DataFrame } from '@antv/data-wizard';
import { getChartTypeSpec } from '../src/advisor';
import { BasicDataPropertyForAdvice } from '../src/ruler';

describe('chart mapping', () => {
  test('chart mapping from CKB', () => {
    const data = [
      { price: 100, type: 'A' },
      { price: 120, type: 'B' },
      { price: 150, type: 'C' },
    ];
    const dataFrame = new DataFrame(data);
    const chartMapping = getChartTypeSpec('pie_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);

    const expectMapping = {
      basis: { type: 'chart' },
      data: { type: 'json-array', values: data },
      layer: [
        {
          mark: { type: 'arc' },
          encoding: {
            theta: { field: 'price', type: 'quantitative' },
            color: { field: 'type', type: 'nominal' },
          },
        },
      ],
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});
