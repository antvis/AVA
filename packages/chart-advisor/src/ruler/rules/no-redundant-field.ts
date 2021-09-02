import { CKBJson } from '@antv/ckb';
import { RuleModule } from '../concepts/rule';

const Wiki = CKBJson('en-US', true);
const allChartTypes = Object.keys(Wiki);

export const noRedundantField: RuleModule = {
  id: 'no-redundant-field',
  type: 'HARD',
  docs: {
    lintText: 'No redundant field.',
  },
  trigger: ({ chartType }) => {
    return allChartTypes.indexOf(chartType) !== -1;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && chartType && Wiki[chartType]) {
      const dataPres = Wiki[chartType].dataPres || [];
      const maxFieldQty = dataPres
        .map((e: any) => {
          if (e.maxQty === '*') {
            return 99;
          }
          return e.maxQty;
        })
        .reduce((acc: number, cv: number) => acc + cv);

      if (dataProps.length) {
        const fieldQty = dataProps.length;
        if (fieldQty <= maxFieldQty) {
          result = 1;
        }
      }
    }

    return result;
  },
};
