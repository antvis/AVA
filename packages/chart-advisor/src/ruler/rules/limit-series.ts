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

export const limitSeries: RuleModule = {
  id: 'limit-series',
  type: 'SOFT',
  docs: {
    lintText: 'Avoid too many series',
  },
  trigger: ({ chartType, dataProps }) => {
    return allChartTypes.indexOf(chartType) !== -1 && hasSeriesField(dataProps as BasicDataPropertyForAdvice[]);
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

        // const f1 = sortedNominals[0];
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
