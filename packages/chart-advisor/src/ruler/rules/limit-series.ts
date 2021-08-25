import { CKBJson } from '@antv/ckb';
import { intersects } from '../../utils';
import { RuleModule } from '../concepts/rule';
import { compare } from '../utils';

const Wiki = CKBJson('en-US', true);
const allChartTypes = Object.keys(Wiki) as string[];

export const limitSeries: RuleModule = {
  id: 'limit-series',
  type: 'SOFT',
  chartTypes: allChartTypes,
  docs: {
    lintText: 'Avoid too many series',
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
