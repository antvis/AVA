import { CKBJson } from '@antv/ckb';
import { RuleModule } from '../concepts/rule';

import { verifyDataProps } from '../utils';

const Wiki = CKBJson('en-US', true);
const allChartTypes = Object.keys(Wiki) as string[];
export const dataCheck: RuleModule = {
  id: 'data-check',
  type: 'HARD',
  chartTypes: allChartTypes,
  docs: {
    lintText: 'Data must satisfy the data prerequisites.',
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && chartType && Wiki[chartType]) {
      result = 1;
      const dataPres = Wiki[chartType].dataPres || [];
      dataPres.forEach((dataPre) => {
        if (!verifyDataProps(dataPre, dataProps)) {
          result = 0;
        }
        return true;
      });
    }
    return result;
  },
};
