import { getChartTypeSpec } from '../src/advisor';
import { DataFrame } from '../src/advisor/utils/dataframe';

describe('chart mapping', () => {
  test('chart mapping from CKB', () => {
    const data = [
      { price: 100, cost: 100, revenue: 500, amount: 150, type: 'A' },
      { price: 120, cost: 200, revenue: 550, amount: 250, type: 'B' },
      { price: 150, cost: 410, revenue: 600, amount: 60, type: 'C' },
    ];
    const dataFrame = new DataFrame(data, ['price', 'type']);
    const chartMapping = getChartTypeSpec('pie_chart', dataFrame);

    const expectMapping = {
      basis: { type: 'chart' },
      data: { type: 'json-array', values: dataFrame.toJson() },
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
