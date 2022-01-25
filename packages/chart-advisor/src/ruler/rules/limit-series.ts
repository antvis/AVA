import { CKBJson } from '@antv/ckb';
import { intersects } from '../../utils';
import { RuleModule, BasicDataPropertyForAdvice } from '../concepts/rule';
import { compare } from '../utils';

const Wiki = CKBJson('en-US', true);
const allChartTypes = Object.keys(Wiki) as string[];

function hasSeriesField(dataProps: BasicDataPropertyForAdvice[]): boolean {
  const nominalOrOrdinalFields = dataProps.filter((field) =>
    intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal'])
  );
  return nominalOrOrdinalFields.length >= 2;
}

// TODO: 重构规则逻辑
/*
sort 后取distinct第二大的字段，是因为第一个要留给维度映射，第二个才轮到 series（一般是颜色映射什么的）。

颜色>6 （颜色非常多的时候）只有 heatmap 的颜色是适合做映射的（因为可以把这样的映射粗看成连续色板）
这里 result=2 是因为如果针对出现这种情况，要给 heatmap 疯狂加分，使得尽可能结果上 heatmap 排到第一名去。

这种规则设置方式整体很不合理，需要在下一轮迭代中重构。
 */

export const limitSeries: RuleModule = {
  id: 'limit-series',
  type: 'SOFT',
  docs: {
    lintText: 'Avoid too many values in one series.',
  },
  trigger: ({ chartType, dataProps }) => {
    return allChartTypes.includes(chartType) && hasSeriesField(dataProps as BasicDataPropertyForAdvice[]);
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && allChartTypes) {
      const nominalOrOrdinalFields = dataProps.filter((field) =>
        intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal'])
      );
      if (nominalOrOrdinalFields.length >= 2) {
        const sortedFields = nominalOrOrdinalFields.sort(compare);

        // const f1 = sortedFields[0];
        const f2 = sortedFields[1];

        if (f2.distinct) {
          result = 1 / f2.distinct;

          if (f2.distinct > 6 && chartType === 'heatmap') {
            // TODO 为什么 result 可以是 2？
            result = 2;
          } else if (chartType === 'heatmap') {
            result = 0;
          }
        }
      }
    }

    return result;
  },
};
