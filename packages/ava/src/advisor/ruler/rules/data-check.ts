import { verifyDataProps } from '../utils';

import type { RuleModule, BasicDataPropertyForAdvice } from '../type';

export const dataCheck: RuleModule = {
  id: 'data-check',
  type: 'HARD',
  docs: {
    lintText: 'Data must satisfy the data prerequisites.',
  },
  trigger: () => {
    return true;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType, chartWIKI } = args;

    if (dataProps && chartType && chartWIKI[chartType]) {
      result = 1;
      const dataPres = chartWIKI[chartType].dataPres || [];
      dataPres.forEach((dataPre) => {
        if (!verifyDataProps(dataPre, dataProps as BasicDataPropertyForAdvice[])) {
          result = 0;
        }
        return true;
      });
    }
    return result;
  },
};
