import { DataFrame } from '../../../../src/data';
import { getChartTypeSpec } from '../../../../src/advisor/advise-pipeline/spec-mapping';
import { BasicDataPropertyForAdvice } from '../../../../src/advisor/ruler';

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
      type: 'interval',
      data,
      encode: {
        color: 'type',
        y: 'price',
      },
      coordinate: { type: 'theta' },
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});
