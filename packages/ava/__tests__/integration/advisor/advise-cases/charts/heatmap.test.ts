import { dataByChartId } from '@antv/data-samples';

import { Advisor } from '../../../../../src/advisor/index';

// In the following cases, the recommended result should be a line chart.
describe('should advise line', () => {
  test('test case from @antv/data-samples', async () => {
    const data = await dataByChartId('heatmap');

    /*
     这个数据是这样的：[
      { "x": -5, "y": -5, "z": 50 },
      { "x": -4, "y": -5, "z": 41 },
      { "x": -3, "y": -5, "z": 34 },
      { "x": -2, "y": -5, "z": 29 },
      { "x": -1, "y": -5, "z": 26 },
      { "x": 0, "y": -5, "z": 25 },
      { "x": 1, "y": -5, "z": 26 },
    ...]
      会导致 dw 自动将 x，y 判断为 interval 类型。
      会导致推荐出错，因此在推荐前，将 x，y 强行指定为 nominal 类型。
     */

    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({
      data,
      // 传 dataprops 的原因 参考上方注释
      dataProps: [
        { name: 'x', levelOfMeasurements: ['Nominal'] },
        { name: 'y', levelOfMeasurements: ['Nominal'] },
      ],
    });

    expect(advices.map((advice) => advice.type).includes('heatmap')).toBe(true);
  });
});
